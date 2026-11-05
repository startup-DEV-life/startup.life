"""Smooth, original vertex paint shared by authored island terrain chunks."""
import math

import bpy


def paint_terrain(mesh, layout_vertices, center_x, center_z, radius_x, radius_z):
    colors = mesh.color_attributes.new(name="PaintTint", type="FLOAT_COLOR", domain="POINT")
    for index, (x, blender_y, _) in enumerate(layout_vertices):
        z = -blender_y
        radius = math.hypot((x - center_x) / radius_x, (z - center_z) / radius_z)
        edge = max(0, min(1, (radius - 0.79) / 0.15))
        edge = edge * edge * (3 - 2 * edge)
        brush = math.sin(x * 0.005 + math.cos(z * 0.004)) * math.cos(z * 0.006) * 0.035
        meadow = (0.30 + brush, 0.48 + brush, 0.33 + brush * 0.6)
        sand = (0.79, 0.68, 0.47)
        colors.data[index].color = (*(meadow[c] * (1 - edge) + sand[c] * edge for c in range(3)), 1)
    material = bpy.data.materials.new("Painted island ground")
    material.diffuse_color = (1, 1, 1, 1)
    material.use_nodes = True
    vertex_color = material.node_tree.nodes.new("ShaderNodeVertexColor")
    vertex_color.layer_name = "PaintTint"
    bsdf = material.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Roughness"].default_value = 1
    material.node_tree.links.new(vertex_color.outputs["Color"], bsdf.inputs["Base Color"])
    mesh.materials.clear()
    mesh.materials.append(material)
    for face in mesh.polygons:
        face.material_index = 0
        face.use_smooth = True
