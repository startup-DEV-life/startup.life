"""Build low- and high-detail GLB chunks for the second continuous island.

Run with Blender 5.x:
  blender --background --factory-startup --python tools/blender/build_east_island.py

Geometry is original and deterministic. The island is positioned in the shared
ThreeCity coordinate frame so the player and Socket.IO coordinates do not jump.
"""

import math
from pathlib import Path

import bpy


ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "frontend/public/models/east-island"
SOURCES = ROOT / "assets/blender/east-island"
OUT.mkdir(parents=True, exist_ok=True)
SOURCES.mkdir(parents=True, exist_ok=True)
bpy.context.preferences.filepaths.save_version = 0
CX, CZ, RX, RZ = 3150, 33, 850, 720


def reset():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for mat in list(bpy.data.materials):
        bpy.data.materials.remove(mat)


def material(name, rgb):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*rgb, 1)
    mat.use_nodes = True
    mat.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (*rgb, 1)
    return mat


def cube(name, x, z, y, width, depth, height, mat):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x, -z, y))
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = (width, depth, height)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(mat)
    return obj


def build_land(detail, grass, sand, cliff):
    segments, rings = (96, 20) if detail else (40, 6)
    verts, faces, mats = [], [], []
    for r in range(rings + 1):
        f = r / rings
        for i in range(segments + 1):
            a = i / segments * math.tau
            ripple = 1 + 0.018 * math.sin(a * 6) + 0.012 * math.sin(a * 13)
            x, z = CX + math.cos(a) * RX * f * ripple, CZ + math.sin(a) * RZ * f * ripple
            y = 2.6 + 0.25 * math.sin(x * 0.009 + z * 0.004) - max(0, f - 0.82) * 4
            verts.append((x, -z, y))
    for r in range(rings):
        for i in range(segments):
            a = r * (segments + 1) + i
            b = a + segments + 1
            faces.append((a, b, b + 1, a + 1))
            mats.append(1 if r / rings > 0.8 else 0)
    mesh = bpy.data.meshes.new("East island land")
    mesh.from_pydata(verts, [], faces)
    mesh.materials.append(grass)
    mesh.materials.append(sand)
    mesh.update()
    obj = bpy.data.objects.new("EastIslandTerrain", mesh)
    bpy.context.collection.objects.link(obj)
    for poly, index in zip(mesh.polygons, mats):
        poly.material_index = index
        poly.use_smooth = detail
    # A simple cliff skirt makes the shoreline read as an island from the bridge.
    wall_verts, wall_faces = [], []
    for i in range(segments + 1):
        a = i / segments * math.tau
        x, z = CX + math.cos(a) * RX, CZ + math.sin(a) * RZ
        wall_verts.extend(((x, -z, 1.8), (x, -z, -13.5)))
    for i in range(segments):
        j = i * 2
        wall_faces.append((j, j + 1, j + 3, j + 2))
    wall = bpy.data.meshes.new("East island cliff")
    wall.from_pydata(wall_verts, [], wall_faces)
    wall.materials.append(cliff)
    wall.update()
    bpy.context.collection.objects.link(bpy.data.objects.new("CoastCliff", wall))


def merge_by_material():
    groups = {}
    for obj in bpy.context.scene.objects:
        if obj.type == "MESH" and obj.name not in ("EastIslandTerrain", "CoastCliff", "Signal tower"):
            groups.setdefault(obj.data.materials[0].name, []).append(obj)
    for name, objects in groups.items():
        if len(objects) < 2:
            continue
        bpy.ops.object.select_all(action="DESELECT")
        for obj in objects:
            obj.select_set(True)
        bpy.context.view_layer.objects.active = objects[0]
        bpy.ops.object.join()
        objects[0].name = f"Batched {name} architecture"


def save(name):
    bpy.ops.wm.save_as_mainfile(filepath=str(SOURCES / f"{name}.blend"))
    path = OUT / f"{name}.glb"
    bpy.ops.export_scene.gltf(filepath=str(path), export_format="GLB", export_apply=True)
    print(f"EXPORTED {path} {path.stat().st_size}")


def build(detail):
    reset()
    grass = material("Moss green", (0.28, 0.50, 0.38))
    sand = material("Coastal ivory", (0.79, 0.69, 0.46))
    cliff = material("Weathered cliff", (0.39, 0.43, 0.42))
    ink = material("Ink blue", (0.08, 0.14, 0.24))
    jade = material("Jade glass", (0.09, 0.44, 0.46))
    pearl = material("Pale stone", (0.70, 0.72, 0.64))
    gold = material("Sun gold", (0.91, 0.62, 0.23))
    road = material("Causeway asphalt", (0.26, 0.32, 0.36))
    build_land(detail, grass, sand, cliff)
    # The main avenue continues directly from the bridge, without a portal.
    cube("Island avenue", CX, CZ, 3.05, 1500, 62, 0.5, road)
    # Low-detail silhouette remains readable before detailed geometry streams in.
    cube("Signal tower", CX + 90, CZ - 190, 78, 88, 88, 150, jade)
    for level in range(4):
        cube("Signal tower band", CX + 90, CZ - 190, 33 + level * 35, 98, 98, 5, pearl)
    cube("Crowned roof", CX + 90, CZ - 190, 159, 120, 116, 12, ink)
    cube("Crowned roof gold cap", CX + 90, CZ - 190, 167, 90, 88, 3, gold)
    if detail:
        # A compact ancient-meets-tech district with open walks between buildings.
        for side in (-1, 1):
            for index in range(5):
                x = CX - 465 + index * 225
                z = CZ + side * (145 + (index % 2) * 34)
                height = 35 + (index % 3) * 20
                cube("Guild workspace", x, z, 3.0 + height / 2, 100, 82, height, jade if index % 2 else pearl)
                cube("Guild roof", x, z, 5 + height, 116, 98, 8, ink)
                cube("Guild roof trim", x, z, 10 + height, 92, 76, 2, gold)
        for x in (CX - 360, CX - 120, CX + 120, CX + 360):
            cube("Avenue marker", x, CZ, 3.5, 18, 1.5, 0.6, gold)
        cube("Garden arcade", CX - 180, CZ - 360, 23, 240, 22, 40, pearl)
        cube("Garden arcade roof", CX - 180, CZ - 360, 48, 260, 35, 8, ink)
    merge_by_material()
    save("near" if detail else "far")


build(False)
build(True)
