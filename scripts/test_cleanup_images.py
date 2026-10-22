import contextlib
import copy
import datetime as dt
import importlib.util
import io
import json
from pathlib import Path
import subprocess
import sys
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location(
    "cleanup_images", Path(__file__).with_name("cleanup-images.py"))
cleanup = importlib.util.module_from_spec(spec)
spec.loader.exec_module(cleanup)
NOW = dt.datetime(2026, 10, 22, tzinfo=dt.timezone.utc)


def image(number, age, tags=None, source=cleanup.SOURCE):
    return {"Id": f"sha256:{number:064x}",
            "Created": (NOW - dt.timedelta(days=age)).isoformat(),
            "RepoTags": tags if tags is not None else [f"{cleanup.REPOSITORY}:sha-{number}"],
            "RepoDigests": [],
            "Config": {"Labels": {"org.opencontainers.image.source": source}}}


class RetentionTests(unittest.TestCase):
    def test_age_and_count_are_both_required(self):
        images = [image(n, n * 5) for n in range(1, 8)]
        rows = cleanup.plan(images, set(), NOW, 14, 5, set())
        self.assertEqual([i["Id"] for i, reasons in rows if not reasons],
                         [images[5]["Id"], images[6]["Id"]])

    def test_cutoff_and_recent_images_survive_beyond_count(self):
        images = [image(n, n) for n in range(1, 16)]
        rows = cleanup.plan(images, set(), NOW, 14, 2, set())
        self.assertEqual([i["Id"] for i, reasons in rows if not reasons],
                         [images[-1]["Id"]])

    def test_running_stopped_previous_and_latest_are_protected(self):
        images = [image(n, n * 10) for n in range(1, 7)]
        images[-1]["RepoTags"] = [cleanup.REPOSITORY + ":latest"]
        rows = cleanup.plan(images, {images[2]["Id"], images[3]["Id"]},
                            NOW, 14, 2, {images[4]["Id"]})
        self.assertTrue(all(reasons for _, reasons in rows))

    def test_fewer_than_keep_survive_even_when_old(self):
        rows = cleanup.plan([image(1, 100), image(2, 200)], set(), NOW, 14, 5, set())
        self.assertTrue(all(reasons for _, reasons in rows))

    def test_ownership_dangling_and_foreign_aliases(self):
        self.assertTrue(cleanup.owned(image(1, 100, tags=[])))
        self.assertFalse(cleanup.owned(image(1, 100, tags=[], source="other")))
        shared = image(1, 100)
        shared["RepoTags"].append("other-project:latest")
        self.assertFalse(cleanup.owned(shared))
        shared["RepoTags"].pop()
        shared["RepoDigests"] = ["ghcr.io/other/app@sha256:123"]
        self.assertFalse(cleanup.owned(shared))
        self.assertFalse(cleanup.owned(image(2, 100, tags=[cleanup.REPOSITORY + "-other:v1"])))

    def test_remove_never_forces_and_only_uses_owned_references(self):
        target = image(7, 100)
        target["RepoTags"].append(cleanup.REPOSITORY + ":rollback-7")
        with patch.object(cleanup, "container_images", return_value=set()), patch.object(
                cleanup, "docker", side_effect=[json.dumps([target]), "", ""]) as command:
            cleanup.remove(target)
        self.assertEqual(command.call_args_list[1].args,
                         ("image", "rm", *target["RepoTags"]))
        self.assertNotIn("--force", str(command.call_args_list))

    def test_remove_dangling_by_id(self):
        target = image(7, 100, tags=[])
        with patch.object(cleanup, "container_images", return_value=set()), patch.object(
                cleanup, "docker", side_effect=[json.dumps([target]), ""]) as command:
            cleanup.remove(target)
        self.assertEqual(command.call_args_list[-1].args, ("image", "rm", target["Id"]))

    def test_mutation_aborts_if_aliases_or_container_references_changed(self):
        target = image(7, 100)
        changed = copy.deepcopy(target)
        changed["RepoTags"].append("other:latest")
        for fresh, used in [(changed, set()), (target, {target["Id"]})]:
            with self.subTest(fresh=fresh, used=used), patch.object(
                    cleanup, "container_images", return_value=used), patch.object(
                    cleanup, "docker", return_value=json.dumps([fresh])) as command:
                with self.assertRaises(RuntimeError):
                    cleanup.remove(target)
                self.assertEqual(command.call_count, 1)

    def test_cli_deduplicates_ids_and_defaults_to_preview(self):
        target = image(7, 100)
        def fake_docker(*args):
            if args[:2] == ("image", "ls"):
                return target["Id"] + "\n" + target["Id"]
            if args[:2] == ("image", "inspect"):
                return json.dumps([target])
            if args[:2] == ("container", "ls"):
                return ""
            self.fail(f"Unexpected mutation: {args}")
        with patch.object(sys, "argv", ["cleanup-images.py"]), patch.object(
                cleanup, "docker", side_effect=fake_docker), patch.object(
                cleanup, "remove") as remove, contextlib.redirect_stdout(io.StringIO()) as output:
            cleanup.main()
        self.assertEqual(output.getvalue().count('"action"'), 1)
        self.assertIn("PREVIEW", output.getvalue())
        remove.assert_not_called()

    def test_inspect_failure_aborts_without_deletion(self):
        with patch.object(sys, "argv", ["cleanup-images.py", "--apply"]), patch.object(
                cleanup, "docker", side_effect=["sha256:1", subprocess.CalledProcessError(1, "docker")]), patch.object(
                cleanup, "remove") as remove:
            with self.assertRaises(subprocess.CalledProcessError):
                cleanup.main()
        remove.assert_not_called()

    def test_cli_apply_only_removes_unprotected_candidates(self):
        images = [image(n, 30 + n) for n in range(1, 9)]
        lookup = {i["Id"]: i for i in images}
        def fake_docker(*args):
            if args[:2] == ("image", "ls"):
                return "\n".join([*lookup, images[0]["Id"]])
            if args[:2] == ("image", "inspect"):
                return json.dumps([lookup[args[2]]])
            self.fail(f"Unexpected command: {args}")
        with patch.object(sys, "argv", ["cleanup-images.py", "--apply",
                                       "--protect-image", images[6]["Id"]]), patch.object(
                cleanup, "docker", side_effect=fake_docker), patch.object(
                cleanup, "container_images", return_value={images[5]["Id"]}), patch.object(
                cleanup, "remove") as remove, contextlib.redirect_stdout(io.StringIO()):
            cleanup.main()
        remove.assert_called_once_with(images[7])


if __name__ == "__main__":
    unittest.main()
