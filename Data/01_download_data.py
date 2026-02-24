"""
Phase 1 — Script 1 of 3
========================
Download & Extract Cricsheet CSV2 Data
---------------------------------------
Cricsheet provides free, structured ball-by-ball data in a "csv2" format
where every match comes as TWO files:
  • <match_id>_info.csv   — match-level metadata (teams, venue, date, result …)
  • <match_id>.csv        — ball-by-ball deliveries

This script:
  1. Creates the required folder structure.
  2. Downloads the chosen format ZIPs from Cricsheet.
  3. Extracts them into data/raw/<format>/.
  4. Reports a brief inventory so you know what you have before proceeding.

Usage:
  python 01_download_data.py                    # downloads all configured formats
  python 01_download_data.py --formats t20 odi  # only T20 and ODI
  python 01_download_data.py --formats t20 --force  # re-download even if present

Note: ZIPs are ~30-80 MB each; extraction produces 20 000+ files total.
Total download time on a typical connection: 2-5 minutes.
"""

import argparse
import os
import sys
import zipfile
from pathlib import Path

import requests
from loguru import logger
from tqdm import tqdm

# ── bootstrap sys.path so config is importable when run from any directory ──
sys.path.insert(0, str(Path(__file__).parent))
from config import CRICSHEET_URLS, RAW_DIR, LOG_LEVEL

# ── logging ─────────────────────────────────────────────────────────────────
logger.remove()
logger.add(sys.stderr, level=LOG_LEVEL,
           format="<green>{time:HH:mm:ss}</green> | <level>{level: <8}</level> | {message}")


# ────────────────────────────────────────────────────────────────────────────
def ensure_dirs(formats: list[str]) -> None:
    """Create output directories for each requested format."""
    for fmt in formats:
        path = Path(RAW_DIR) / fmt
        path.mkdir(parents=True, exist_ok=True)
        logger.debug(f"Directory ready: {path}")


def download_file(url: str, dest: Path, force: bool = False) -> Path:
    """
    Stream-download *url* to *dest*.
    Skips if the file already exists and force=False.
    Returns the local path.
    """
    if dest.exists() and not force:
        logger.info(f"Already downloaded: {dest.name} — skipping (use --force to re-download)")
        return dest

    logger.info(f"Downloading {url} …")
    response = requests.get(url, stream=True, timeout=120)
    response.raise_for_status()

    total = int(response.headers.get("content-length", 0))
    chunk_size = 1024 * 64  # 64 KB

    with open(dest, "wb") as fh, tqdm(
        total=total, unit="iB", unit_scale=True,
        desc=dest.name, ncols=80,
    ) as bar:
        for chunk in response.iter_content(chunk_size=chunk_size):
            fh.write(chunk)
            bar.update(len(chunk))

    logger.success(f"Saved: {dest} ({dest.stat().st_size / 1e6:.1f} MB)")
    return dest


def extract_zip(zip_path: Path, dest_dir: Path, force: bool = False) -> int:
    """
    Extract *zip_path* into *dest_dir*.
    Returns the number of files extracted.
    Skips silently if destination already contains files and force=False.
    """
    existing = list(dest_dir.glob("*.csv"))
    if existing and not force:
        logger.info(
            f"Found {len(existing)} CSV files in {dest_dir.name}/ — skipping extraction "
            f"(use --force to re-extract)"
        )
        return len(existing)

    logger.info(f"Extracting {zip_path.name} → {dest_dir} …")
    with zipfile.ZipFile(zip_path, "r") as zf:
        members = zf.namelist()
        for member in tqdm(members, desc="extracting", ncols=80):
            zf.extract(member, dest_dir)

    extracted = list(dest_dir.glob("*.csv"))
    logger.success(f"Extracted {len(extracted)} CSV files into {dest_dir.name}/")
    return len(extracted)


def inventory(raw_dir: Path) -> None:
    """Print a quick inventory of what has been downloaded."""
    print("\n" + "─" * 60)
    print("  DATA INVENTORY")
    print("─" * 60)
    for fmt_dir in sorted(raw_dir.iterdir()):
        if not fmt_dir.is_dir():
            continue
        deliveries = len(list(fmt_dir.glob("[!_]*.csv")))  # exclude _info files
        info_files  = len(list(fmt_dir.glob("*_info.csv")))
        # info_files is the actual match count
        print(f"  {fmt_dir.name:8s}  {info_files:>5} matches  ({deliveries:>6} delivery files)")
    print("─" * 60 + "\n")


# ────────────────────────────────────────────────────────────────────────────
def main() -> None:
    parser = argparse.ArgumentParser(description="Download Cricsheet data")
    parser.add_argument(
        "--formats", nargs="+",
        choices=list(CRICSHEET_URLS.keys()),
        default=list(CRICSHEET_URLS.keys()),
        help="Which formats to download (default: all configured).",
    )
    parser.add_argument(
        "--force", action="store_true",
        help="Re-download and re-extract even if files already exist.",
    )
    args = parser.parse_args()

    ensure_dirs(args.formats)
    raw_root = Path(RAW_DIR)

    for fmt in args.formats:
        url      = CRICSHEET_URLS[fmt]
        zip_dest = raw_root / f"{fmt}.zip"
        fmt_dir  = raw_root / fmt

        # 1. Download
        download_file(url, zip_dest, force=args.force)

        # 2. Extract
        extract_zip(zip_dest, fmt_dir, force=args.force)

    inventory(raw_root)
    logger.success("Phase 1 / Step 1 complete. Proceed to 02_setup_database.py")


if __name__ == "__main__":
    main()
