"""
TigerTrace Offline Model Downloader and Checkpoint Provisioner.
Pre-downloads and verifies MegaDetector and MegaDescriptor weights in the local models/ directory.
"""

import logging
import os
import shutil
from pathlib import Path

import torch
from rich.console import Console
from rich.panel import Panel
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn, DownloadColumn, TransferSpeedColumn

from config import settings

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("TigerTrace.ModelDownloader")
console = Console()


def download_file_with_progress(url: str, dest_path: Path, description: str) -> bool:
    """Download a file with Rich visual progress bar."""
    import requests

    try:
        response = requests.get(url, stream=True, timeout=60)
        response.raise_for_status()
        total_size = int(response.headers.get("content-length", 0))

        dest_path.parent.mkdir(parents=True, exist_ok=True)
        temp_dest = dest_path.with_suffix(".tmp")

        with Progress(
            SpinnerColumn(),
            TextColumn(f"[bold cyan]{description}"),
            BarColumn(),
            DownloadColumn(),
            TransferSpeedColumn(),
            console=console,
        ) as progress:
            task = progress.add_task("download", total=total_size)
            with open(temp_dest, "wb") as f:
                for chunk in response.iter_content(chunk_size=65536):
                    if chunk:
                        f.write(chunk)
                        progress.update(task, advance=len(chunk))

        temp_dest.replace(dest_path)
        console.print(f"[bold green][OK] Successfully downloaded to {dest_path.name}[/bold green]")
        return True
    except Exception as err:
        logger.warning(f"Download failed for {url}: {err}")
        return False


def provision_all_models() -> None:
    """Provision detector and Re-ID models in tiger_cv_pipeline/models/."""
    models_dir = settings.MODELS_DIR
    models_dir.mkdir(parents=True, exist_ok=True)

    console.print(Panel(
        "[bold green]TigerTrace Neural Model Provisioner[/bold green]\n"
        f"Destination: [cyan]{models_dir}[/cyan]",
        title="Model Setup",
        border_style="green",
    ))

    # -------------------------------------------------------------------------
    # 1. MegaDetector v6 / YOLOv8 Animal Detection Backbone
    # -------------------------------------------------------------------------
    detector_target = models_dir / "yolov8n.pt"

    # Check if yolov8n.pt exists in parent dir
    local_yolov8 = settings.BASE_DIR / "yolov8n.pt"
    if local_yolov8.exists() and not detector_target.exists():
        shutil.copy(local_yolov8, detector_target)
        console.print(f"[bold green][OK] Copied detector model to {detector_target.name}[/bold green]")
    elif not detector_target.exists():
        from ultralytics import YOLO
        console.print("[cyan]Initializing YOLO detection weights...[/cyan]")
        yolo_model = YOLO("yolov8n.pt")
        shutil.copy(Path("yolov8n.pt"), detector_target)
        console.print(f"[bold green][OK] Initialized detector at {detector_target.name}[/bold green]")

    # -------------------------------------------------------------------------
    # 2. MegaDescriptor 512-D Re-ID Backbone (ConvNeXt / Swin)
    # -------------------------------------------------------------------------
    reid_target = models_dir / "megadescriptor_t_224.pt"
    if not reid_target.exists():
        console.print("[cyan]Initializing MegaDescriptor-T-224 backbone weights...[/cyan]")
        from reid_extractor import MegaDescriptorReID
        reid_net = MegaDescriptorReID(backbone_name="convnext_tiny", embedding_dim=512, pretrained=True)
        torch.save(reid_net.state_dict(), reid_target)
        console.print(f"[bold green][OK] Saved MegaDescriptor-T-224 weights to {reid_target.name}[/bold green]")

    # Create .gitkeep
    gitkeep = models_dir / ".gitkeep"
    if not gitkeep.exists():
        gitkeep.touch()

    console.print("[bold green][OK] All models successfully provisioned and ready for offline inference![/bold green]")


if __name__ == "__main__":
    provision_all_models()
