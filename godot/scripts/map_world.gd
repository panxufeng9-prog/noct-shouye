extends Node2D

const MAP_ORDER := ["moonshadow", "wetland", "snowfield", "ashcanyon"]
const BORDER_THICKNESS := 32.0

var map_definitions := NoctMapDefinitions.all()
var current_map_id := "moonshadow"
var map_root: Node2D
var player: NoctPlayer
var debug_overlay: CollisionDebugOverlay
var title_label: Label
var status_label: Label
var debug_enabled := true
var ui_font: Font


func _ready() -> void:
	player = NoctPlayer.new()
	player.name = "Noct"
	add_child(player)
	_build_hud()
	_load_map(current_map_id)


func _unhandled_key_input(event: InputEvent) -> void:
	if not event.pressed or event.echo:
		return
	match event.keycode:
		KEY_1:
			_load_map(MAP_ORDER[0])
		KEY_2:
			_load_map(MAP_ORDER[1])
		KEY_3:
			_load_map(MAP_ORDER[2])
		KEY_4:
			_load_map(MAP_ORDER[3])
		KEY_R:
			_reset_player()
		KEY_F2:
			debug_enabled = not debug_enabled
			if debug_overlay:
				debug_overlay.visible = debug_enabled
			_update_status()


func _load_map(map_id: String) -> void:
	current_map_id = map_id
	if is_instance_valid(map_root):
		map_root.free()
	map_root = Node2D.new()
	map_root.name = "Map_%s" % map_id
	add_child(map_root)
	move_child(map_root, 0)

	var definition: Dictionary = map_definitions[map_id]
	var texture: Texture2D = load(definition["texture"])
	_build_background(texture)
	var collision_geometry := _build_collisions(definition)
	var occluder_geometry := _build_occluders(definition, texture)
	_build_debug_overlay(collision_geometry, occluder_geometry)
	_reset_player()
	title_label.text = "NOCT · 守夜  |  %s" % definition["name"]
	_update_status()


func _build_background(texture: Texture2D) -> void:
	var background := Sprite2D.new()
	background.name = "GroundPainting"
	background.texture = texture
	background.centered = false
	background.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	background.scale = NoctMapDefinitions.WORLD_SIZE / texture.get_size()
	background.z_index = -20
	map_root.add_child(background)


func _build_collisions(definition: Dictionary) -> Array[PackedVector2Array]:
	var geometry: Array[PackedVector2Array] = []
	var static_body := StaticBody2D.new()
	static_body.name = "IndependentMapCollision"
	map_root.add_child(static_body)
	for index in definition["solids"].size():
		var points := NoctMapDefinitions.shape_to_world(definition["solids"][index])
		var collider := CollisionPolygon2D.new()
		collider.name = "Obstacle_%02d" % index
		collider.polygon = points
		static_body.add_child(collider)
		geometry.append(points)
	_add_world_boundaries(static_body)
	return geometry


func _add_world_boundaries(parent: StaticBody2D) -> void:
	var world := NoctMapDefinitions.WORLD_SIZE
	_add_boundary(parent, "NorthBoundary", Vector2(world.x * 0.5, -BORDER_THICKNESS * 0.5), Vector2(world.x + BORDER_THICKNESS * 2.0, BORDER_THICKNESS))
	_add_boundary(parent, "SouthBoundary", Vector2(world.x * 0.5, world.y + BORDER_THICKNESS * 0.5), Vector2(world.x + BORDER_THICKNESS * 2.0, BORDER_THICKNESS))
	_add_boundary(parent, "WestBoundary", Vector2(-BORDER_THICKNESS * 0.5, world.y * 0.5), Vector2(BORDER_THICKNESS, world.y))
	_add_boundary(parent, "EastBoundary", Vector2(world.x + BORDER_THICKNESS * 0.5, world.y * 0.5), Vector2(BORDER_THICKNESS, world.y))


func _add_boundary(parent: StaticBody2D, node_name: String, center: Vector2, size: Vector2) -> void:
	var collider := CollisionShape2D.new()
	collider.name = node_name
	var rectangle := RectangleShape2D.new()
	rectangle.size = size
	collider.shape = rectangle
	collider.position = center
	parent.add_child(collider)


func _build_occluders(definition: Dictionary, texture: Texture2D) -> Array[PackedVector2Array]:
	var geometry: Array[PackedVector2Array] = []
	var texture_scale := texture.get_size() / NoctMapDefinitions.REFERENCE_SIZE
	for index in definition["occluders"].size():
		var entry: Dictionary = definition["occluders"][index]
		var rect: Rect2 = entry["rect"]
		var points := NoctMapDefinitions.rect_to_world(rect)
		var overlay := ForegroundOccluder.new()
		overlay.name = "Foreground_%02d" % index
		overlay.player = player
		overlay.foot_y = float(entry["foot_y"]) * NoctMapDefinitions.WORLD_SCALE.y
		overlay.texture = texture
		overlay.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
		overlay.polygon = points
		overlay.uv = PackedVector2Array([
			rect.position * texture_scale,
			Vector2(rect.end.x, rect.position.y) * texture_scale,
			rect.end * texture_scale,
			Vector2(rect.position.x, rect.end.y) * texture_scale,
		])
		map_root.add_child(overlay)
		geometry.append(points)
	return geometry


func _build_debug_overlay(collisions: Array[PackedVector2Array], occluders: Array[PackedVector2Array]) -> void:
	debug_overlay = CollisionDebugOverlay.new()
	debug_overlay.name = "CollisionDebug"
	debug_overlay.z_index = 100
	debug_overlay.set_geometry(collisions, occluders)
	debug_overlay.visible = debug_enabled
	map_root.add_child(debug_overlay)


func _reset_player() -> void:
	var reference_spawn: Vector2 = map_definitions[current_map_id]["spawn"]
	player.reset_to(reference_spawn * NoctMapDefinitions.WORLD_SCALE)


func _build_hud() -> void:
	ui_font = load("res://godot/assets/fonts/NotoSansSC.ttf")

	var canvas := CanvasLayer.new()
	canvas.name = "HUD"
	canvas.layer = 50
	add_child(canvas)

	var top_bar := ColorRect.new()
	top_bar.color = Color(0.015, 0.035, 0.075, 0.88)
	top_bar.set_anchors_and_offsets_preset(Control.PRESET_TOP_WIDE)
	top_bar.custom_minimum_size.y = 54
	canvas.add_child(top_bar)

	title_label = Label.new()
	title_label.position = Vector2(14, 8)
	title_label.add_theme_font_override("font", ui_font)
	title_label.add_theme_color_override("font_color", Color("d9f5ff"))
	title_label.add_theme_font_size_override("font_size", 17)
	top_bar.add_child(title_label)

	status_label = Label.new()
	status_label.position = Vector2(14, 31)
	status_label.add_theme_font_override("font", ui_font)
	status_label.add_theme_color_override("font_color", Color("a8c9dd"))
	status_label.add_theme_font_size_override("font_size", 11)
	top_bar.add_child(status_label)

	var help := Label.new()
	help.text = "WASD/方向键移动  ·  1–4切换地图  ·  R回到中心  ·  F2碰撞调试"
	help.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	help.add_theme_font_override("font", ui_font)
	help.add_theme_color_override("font_color", Color("d7e8ef"))
	help.add_theme_font_size_override("font_size", 11)
	help.set_anchors_and_offsets_preset(Control.PRESET_BOTTOM_WIDE)
	help.offset_top = -25
	help.offset_bottom = -5
	canvas.add_child(help)


func _update_status() -> void:
	status_label.text = "红色=实体碰撞 · 蓝色=树冠遮挡 · 调试%s" % ("开启" if debug_enabled else "关闭")
