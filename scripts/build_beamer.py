#!/usr/bin/env python3
"""Build a local Beamer source twice with XeLaTeX; optionally render PDF pages."""
import argparse
import hashlib
import json
from pathlib import Path
import re
import shutil
import subprocess
import sys


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("--render", action="store_true")
    args = parser.parse_args()
    source = args.source.resolve()
    if not source.is_file() or source.suffix.lower() != ".tex":
        parser.error("Source must be an existing .tex file")
    executable = shutil.which("xelatex")
    if not executable:
        parser.error("XeLaTeX not found on PATH. Install or activate TeX Live/MiKTeX, then retry.")
    if args.render:
        try:
            import pymupdf as fitz
        except ImportError:
            parser.error("Rendering requires PyMuPDF: python -m pip install pymupdf")
    out = source.parent / "build"
    out.mkdir(exist_ok=True)
    report = {"source": source.name, "engine": "xelatex", "passes": [], "rendered": False}
    command = [executable, "-no-shell-escape", "-interaction=nonstopmode", "-halt-on-error",
               "-file-line-error", "-output-directory=build", source.name]
    for index in (1, 2):
        run = subprocess.run(command, cwd=source.parent, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
        console = run.stdout.decode("utf-8", errors="replace")
        (out / f"compile-pass-{index}.txt").write_text(console, encoding="utf-8")
        report["passes"].append({"pass": index, "returncode": run.returncode})
        if run.returncode:
            report["status"] = "compile-failed"
            (out / "build-report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
            print(console[-7000:], file=sys.stderr)
            sys.exit(run.returncode)
    pdf = out / f"{source.stem}.pdf"
    if not pdf.is_file():
        raise RuntimeError("XeLaTeX returned success but produced no PDF")
    log = (out / f"{source.stem}.log").read_text(encoding="utf-8", errors="replace")
    report["warnings"] = [line for line in log.splitlines()
                          if re.search(r"Overfull \\[hv]box|Missing character|LaTeX Warning", line)]
    report["pdf"] = pdf.name
    report["pdf_sha256"] = hashlib.sha256(pdf.read_bytes()).hexdigest()
    report["status"] = "compiled"
    if args.render:
        pages = out / "pages"
        pages.mkdir(exist_ok=True)
        with fitz.open(pdf) as document:
            report["page_count"] = len(document)
            for index, page in enumerate(document, start=1):
                page.get_pixmap(matrix=fitz.Matrix(1.5, 1.5), alpha=False).save(pages / f"page-{index:02}.png")
        report["rendered"] = True
    (out / "build-report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Compiled: {pdf}")
    if report["warnings"]:
        print(f"Review {len(report['warnings'])} log warnings in {out / 'build-report.json'}")


if __name__ == "__main__":
    main()
