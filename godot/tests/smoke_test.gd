extends SceneTree


func _initialize() -> void:
	call_deferred("_run")


func _run() -> void:
	var packed: PackedScene = load("res://godot/scenes/main.tscn")
	var world := packed.instantiate()
	root.add_child(world)
	await physics_frame
	await physics_frame

	var definitions := NoctMapDefinitions.all()
	_assert(definitions.size() == 4, "expected four exploration maps")
	var player: NoctPlayer = world.get_node("Noct")

	for map_id: String in ["moonshadow", "wetland", "snowfield", "ashcanyon"]:
		world.call("_load_map", map_id)
		await physics_frame
		await physics_frame
		var definition: Dictionary = definitions[map_id]
		_assert(ResourceLoader.exists(definition["texture"]), "%s texture is missing" % map_id)
		_assert(not definition["solids"].is_empty(), "%s has no collision data" % map_id)

		var spawn: Vector2 = definition["spawn"] * NoctMapDefinitions.WORLD_SCALE
		_assert(_hits_static_body(world, player, spawn).is_empty(), "%s spawn overlaps map collision" % map_id)
		var first_shape: Dictionary = definition["solids"][0]
		var obstacle_point: Vector2 = first_shape["center"] * NoctMapDefinitions.WORLD_SCALE
		_assert(not _hits_static_body(world, player, obstacle_point).is_empty(), "%s obstacle collision was not created" % map_id)

	print("Noct Godot smoke test: four maps, safe spawns, and collision bodies verified.")
	quit(0)


func _hits_static_body(world: Node, player: NoctPlayer, point: Vector2) -> Array[Dictionary]:
	var circle := CircleShape2D.new()
	circle.radius = 2.0
	var query := PhysicsShapeQueryParameters2D.new()
	query.shape = circle
	query.transform = Transform2D(0.0, point)
	query.exclude = [player.get_rid()]
	query.collide_with_areas = false
	query.collide_with_bodies = true
	return world.get_world_2d().direct_space_state.intersect_shape(query, 8)


func _assert(condition: bool, message: String) -> void:
	if condition:
		return
	push_error("SMOKE TEST FAILED: %s" % message)
	quit(1)
