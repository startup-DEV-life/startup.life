"""Build original, lightweight Developer Metropolis GLB chunks.

Run with Blender 5.x:
  blender --background --factory-startup --python tools/blender/build_developer_metropolis.py

The output is deterministic and uses only authored geometry and solid-color materials.
Coordinates are in the existing ThreeCity local X/Z space before WORLD_SCALE.
"""

import math
import sys
from pathlib import Path

import bpy
sys.path.insert(0, str(Path(__file__).resolve().parent))
from architecture import curved_roof
from terrain_art import paint_terrain


ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "frontend/public/models/developer-metropolis"
OUT.mkdir(parents=True, exist_ok=True)
SOURCES = ROOT / "assets/blender/developer-metropolis"
SOURCES.mkdir(parents=True, exist_ok=True)
bpy.context.preferences.filepaths.save_version = 0


def reset():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for material in list(bpy.data.materials):
        bpy.data.materials.remove(material)


def material(name, color, metallic=0.0, roughness=0.8):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*color, 1)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color, 1)
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    return m


def cube(name, location, scale, mat, bevel=0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(location[0], -location[1], location[2]))
    o = bpy.context.object
    o.name = name
    o.dimensions = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    o.data.materials.append(mat)
    if bevel:
        mod = o.modifiers.new("Soft edge", "BEVEL")
        mod.width = bevel
        mod.segments = 2
        bpy.context.view_layer.objects.active = o
        bpy.ops.object.modifier_apply(modifier=mod.name)
    return o


def cylinder(name, location, radius, depth, mat, vertices=12):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=(location[0], -location[1], location[2]))
    o = bpy.context.object
    o.name = name
    o.data.materials.append(mat)
    return o


def cone(name, location, r1, r2, depth, mat, vertices=8):
    bpy.ops.mesh.primitive_cone_add(vertices=vertices, radius1=r1, radius2=r2, depth=depth, location=(location[0], -location[1], location[2]))
    o = bpy.context.object
    o.name = name
    o.data.materials.append(mat)
    return o


def export(filename):
    path = OUT / filename
    bpy.ops.wm.save_as_mainfile(filepath=str(SOURCES / filename.replace(".glb", ".blend")))
    bpy.ops.export_scene.gltf(filepath=str(path), export_format="GLB", export_apply=True)
    print(f"EXPORTED {path} {path.stat().st_size}")


def merge_decor_by_material():
    """Keep interactive meshes separate while batching static repeated props."""
    protected = {"Developer Metropolis Hall", "Main entrance glass"}
    groups = {}
    for obj in bpy.context.scene.objects:
        if obj.type == "MESH" and obj.name not in protected:
            groups.setdefault(obj.data.materials[0].name, []).append(obj)
    for name, objects in groups.items():
        if len(objects) < 2:
            continue
        bpy.ops.object.select_all(action="DESELECT")
        for obj in objects:
            obj.select_set(True)
        bpy.context.view_layer.objects.active = objects[0]
        bpy.ops.object.join()
        objects[0].name = f"Batched {name} details"


def terrain_height(x, z):
    edge = max(abs(x) / 1540, abs(z) / 1305)
    t = max(0.0, min(1.0, (edge - 0.82) / 0.18))
    smooth = t * t * (3 - 2 * t)
    return 2.6 + math.sin(x * 0.004 + z * 0.002) * 0.22 + math.cos(z * 0.006 - x * 0.003) * 0.16 - smooth * 0.9


def build_terrain():
    reset()
    grass = material("Illustrated sage grass", (0.33, 0.55, 0.39))
    light_grass = material("Sunlit meadow", (0.49, 0.67, 0.43))
    sand = material("Warm coastline sand", (0.83, 0.71, 0.48))
    vertices, faces, face_mats = [], [], []
    sectors, rings = 128, 32
    rx, rz = 1540 * 0.91, 1305 * 0.91
    for ring in range(rings + 1):
        f = ring / rings
        for sector in range(sectors + 1):
            a = sector / sectors * math.tau
            noise = math.sin(a * 5 + 0.3) * 0.014 + math.sin(a * 9 + 1.2) * 0.008 + math.sin(a * 17) * 0.003
            x, z = math.cos(a) * rx * f * (1 + noise), math.sin(a) * rz * f * (1 + noise)
            # glTF maps Blender -Y to Three.js +Z, and Blender Z to Three.js Y.
            vertices.append((x, -z, terrain_height(x, z) + 0.08))
    for ring in range(rings):
        for sector in range(sectors):
            a = ring * (sectors + 1) + sector
            b = a + sectors + 1
            faces.append((a, b, b + 1, a + 1))
            face_mats.append(2 if ring / rings > 0.82 else (1 if (ring + sector // 7) % 5 == 0 else 0))
    mesh = bpy.data.meshes.new("Developer Metropolis island terrain")
    mesh.from_pydata(vertices, [], faces)
    mesh.materials.clear()
    for mat in (grass, light_grass, sand):
        mesh.materials.append(mat)
    mesh.update()
    obj = bpy.data.objects.new("DeveloperMetropolisTerrain", mesh)
    bpy.context.collection.objects.link(obj)
    for poly, index in zip(mesh.polygons, face_mats):
        poly.material_index = index
        poly.use_smooth = True
    paint_terrain(mesh, vertices, 0, 0, rx, rz)
    export("island-terrain.glb")


def build_campus():
    reset()
    stone = material("Pearl limestone", (0.75, 0.74, 0.64))
    dark = material("Deep ink roof", (0.08, 0.16, 0.25))
    blue = material("Cerulean glass", (0.12, 0.42, 0.59), metallic=0.15, roughness=0.24)
    teal = material("Jade trim", (0.08, 0.51, 0.48), metallic=0.15)
    gold = material("Lantern brass", (0.92, 0.62, 0.23), metallic=0.45)
    warm = material("Sunlit courtyard", (0.77, 0.65, 0.47))
    leaf = material("Garden canopy", (0.18, 0.48, 0.34))
    x, z, y = -960, 535, terrain_height(-960, 535)
    cube("Courtyard plaza", (x, z, y + 0.08), (250, 195, 0.4), warm)
    # Broad glass hall with a clear, clickable entrance facing the road.
    cube("Developer Metropolis Hall", (x, z - 24, y + 34), (130, 94, 68), blue, 4)
    cube("Hall foundation", (x, z - 24, y + 3), (144, 108, 6), dark, 2)
    for level in range(3):
        cube(f"Horizontal floor line {level}", (x, z - 24, y + 18 + level * 20), (136, 99, 2), teal)
    for side in (-1, 1):
        for col in range(5):
            cube(f"Front frame {side} {col}", (x + side * (13 + col * 11), z + 23.3, y + 35), (2, 2, 56), stone)
    cube("Main entrance frame", (x, z + 24, y + 17), (27, 3, 35), stone, 1)
    cube("Main entrance glass", (x, z + 26, y + 14), (19, 1, 27), blue)
    # Asian-inspired roof silhouette and open-air work terraces.
    curved_roof("Swept blue roof", x, z - 24, y + 72, 179, 128, 21, dark)
    cube("Gold ridge", (x, z - 24, y + 94), (53, 5, 2), gold)
    for side in (-1, 1):
        px = x + side * 91
        cylinder("Courtyard pavilion base", (px, z - 35, y + 2), 26, 4, stone, 16)
        for angle in range(0, 360, 90):
            a = math.radians(angle)
            cylinder("Pavilion column", (px + math.cos(a) * 17, z - 35 + math.sin(a) * 17, y + 14), 2.4, 24, stone)
        curved_roof("Pavilion swept roof", px, z - 35, y + 26, 59, 59, 12, dark)
        cube("Pavilion roof accent", (px, z - 35, y + 39), (18, 3, 2), gold)
    # Reusable lanterns and garden trees provide an anime skyline without extra NPCs.
    for i, px in enumerate((x - 108, x - 73, x + 73, x + 108)):
        for pz in (z + 67, z - 35):
            cylinder(f"Lantern pole {i}", (px, pz, y + 15), 1.5, 29, dark, 8)
            cube("Lantern housing", (px, pz, y + 30), (8, 8, 10), gold, 1)
            cone("Lantern cap", (px, pz, y + 37), 7, 2, 4, dark)
    for px, pz in ((x - 110, z + 20), (x + 110, z + 20), (x - 108, z - 35), (x + 108, z - 35)):
        cylinder("Garden tree trunk", (px, pz, y + 11), 2.5, 20, dark, 8)
        cone("Layered tree canopy", (px, pz, y + 27), 15, 1, 25, leaf, 9)
    merge_decor_by_material()
    export("campus.glb")


build_terrain()
build_campus()
