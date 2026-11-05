"""Shared original roof geometry for the authored islands (Blender coordinates)."""
import bpy


def curved_roof(name, x, z, y, width, depth, height, material):
    perimeter = [(-1, -1), (0, -1), (1, -1), (1, 0), (1, 1), (0, 1), (-1, 1), (-1, 0)]
    vertices, faces = [], []
    for radial, rise in [(1, 0.05), (0.8, 0.16), (0.22, 0.9), (0.025, 1)]:
        for i, (px, pz) in enumerate(perimeter):
            corner = 0.22 * height if radial == 1 and i % 2 == 0 else 0
            vertices.append((x + px * width * radial / 2, -(z + pz * depth * radial / 2), y + height * rise + corner))
    for ring in range(3):
        for i in range(8):
            a, b = ring * 8 + i, ring * 8 + (i + 1) % 8
            faces.append((a, b, b + 8, a + 8))
    faces.append(tuple(range(24, 32)))
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(vertices, [], faces)
    mesh.materials.append(material)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    return obj
