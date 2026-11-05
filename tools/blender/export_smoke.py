"""Minimal Blender-to-glTF pipeline check.

Run: blender --background --factory-startup --python tools/blender/export_smoke.py -- /tmp/startup-life-smoke.glb
The output path is required so this check never overwrites a game asset.
"""

import sys
from pathlib import Path

import bpy


def main():
    if "--" not in sys.argv or len(sys.argv) != sys.argv.index("--") + 2:
        raise SystemExit("Expected exactly one GLB output path after --")

    output = Path(sys.argv[-1]).expanduser().resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    bpy.ops.mesh.primitive_cube_add(size=2)
    bpy.context.object.name = "StartupLifeExportSmokeCube"
    bpy.ops.export_scene.gltf(filepath=str(output), export_format="GLB")
    print(f"EXPORT_OK {output} {output.stat().st_size}")


if __name__ == "__main__":
    main()
