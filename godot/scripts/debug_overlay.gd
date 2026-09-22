class_name CollisionDebugOverlay
extends Node2D

var collision_polygons: Array[PackedVector2Array] = []
var occluder_polygons: Array[PackedVector2Array] = []


func set_geometry(collisions: Array[PackedVector2Array], occluders: Array[PackedVector2Array]) -> void:
	collision_polygons = collisions
	occluder_polygons = occluders
	queue_redraw()


func _draw() -> void:
	for points in collision_polygons:
		draw_colored_polygon(points, Color(0.95, 0.18, 0.28, 0.22))
		_draw_closed(points, Color(1.0, 0.35, 0.42, 0.95), 3.0)
	for points in occluder_polygons:
		draw_colored_polygon(points, Color(0.25, 0.75, 1.0, 0.10))
		_draw_closed(points, Color(0.35, 0.85, 1.0, 0.9), 2.0)


func _draw_closed(points: PackedVector2Array, color: Color, width: float) -> void:
	if points.is_empty():
		return
	var closed := points.duplicate()
	closed.append(points[0])
	draw_polyline(closed, color, width, true)
