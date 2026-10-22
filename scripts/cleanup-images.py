#!/usr/bin/env python3
"""Project-scoped Docker image retention. Preview unless --apply is supplied."""

import argparse
import datetime as dt
import json
import subprocess
import sys

REPOSITORY = "ghcr.io/hoahrb/hoa-fuma"
SOURCE = "https://github.com/HOAHRB/hoa-fuma"


def docker(*args):
    return subprocess.check_output(["docker", *args], text=True).strip()


def references(image):
    return (image.get("RepoTags") or []) + (image.get("RepoDigests") or [])


def owned(image):
    refs = references(image)
    # Never unlink aliases belonging to another project, even for shared IDs.
    if any(not ref.startswith(REPOSITORY + ":") and
           not ref.startswith(REPOSITORY + "@") for ref in refs):
        return False
    labels = (image.get("Config") or {}).get("Labels") or {}
    return bool(refs) or labels.get("org.opencontainers.image.source") == SOURCE


def created(image):
    return dt.datetime.fromisoformat(image["Created"].replace("Z", "+00:00"))


def container_images():
    ids = docker("container", "ls", "--all", "--quiet").split()
    # Inspect individually to avoid argument limits; failures abort cleanup.
    return {json.loads(docker("container", "inspect", cid))[0]["Image"]
            for cid in ids}


def plan(images, used, now, days, keep, protected):
    eligible = sorted((i for i in images if owned(i)),
                      key=lambda i: (created(i), i["Id"]), reverse=True)
    newest = {i["Id"] for i in eligible[:keep]}
    cutoff = now - dt.timedelta(days=days)
    result = []
    for image in eligible:
        reasons = []
        if image["Id"] in used:
            reasons.append("container reference (running or stopped)")
        if image["Id"] in protected:
            reasons.append("previous deployment / explicit protection")
        if image["Id"] in newest:
            reasons.append(f"newest {keep} unique images")
        if created(image) >= cutoff:
            reasons.append(f"age <= {days} days")
        if REPOSITORY + ":latest" in (image.get("RepoTags") or []):
            reasons.append("latest tag")
        result.append((image, reasons))
    return result


def remove(image):
    # Recheck references and containers immediately before mutation. Never force.
    fresh = json.loads(docker("image", "inspect", image["Id"]))[0]
    if (not owned(fresh) or references(fresh) != references(image)
            or image["Id"] in container_images()):
        raise RuntimeError(f"Image changed or became protected: {image['Id']}")
    tags = fresh.get("RepoTags") or []
    if tags:
        docker("image", "rm", *tags)
        remaining = docker("image", "ls", "--all", "--quiet", "--no-trunc").split()
        if image["Id"] not in remaining:
            return
    # Includes dangling images and remaining repository digest references.
    docker("image", "rm", image["Id"])


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--days", type=int, default=14)
    parser.add_argument("--keep", type=int, default=5)
    parser.add_argument("--protect-image", action="append", default=[])
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    if args.days < 1 or args.keep < 2:
        parser.error("--days must be >= 1 and --keep must be >= 2")
    ids = sorted(set(docker("image", "ls", "--all", "--quiet", "--no-trunc").split()))
    images = [json.loads(docker("image", "inspect", iid))[0] for iid in ids]
    rows = plan(images, container_images(), dt.datetime.now(dt.timezone.utc),
                args.days, args.keep, set(args.protect_image))
    print(f"{'APPLY' if args.apply else 'PREVIEW'} {REPOSITORY}: "
          f"keep {args.keep} unique IDs AND all images <= {args.days} days", flush=True)
    print(f"Skipped {len(images) - len(rows)} images outside exclusive project ownership.", flush=True)
    for image, reasons in rows:
        print(json.dumps({"action": "KEEP" if reasons else "DELETE",
                          "id": image["Id"], "created": image["Created"],
                          "references": references(image), "reasons": reasons}), flush=True)
    if args.apply:
        for image, reasons in rows:
            if not reasons:
                remove(image)


if __name__ == "__main__":
    try:
        main()
    except (subprocess.CalledProcessError, RuntimeError, ValueError, KeyError) as error:
        print(f"Cleanup aborted: {error}", file=sys.stderr)
        sys.exit(1)
