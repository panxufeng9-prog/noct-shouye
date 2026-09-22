class_name NoctPlayer
extends CharacterBody2D

const SPEED := 150.0
const FRAME_SIZE := Vector2i(64, 64)

var sprite: Sprite2D
var camera: Camera2D
var animation_clock := 0.0
var last_direction := Vector2.DOWN


func _ready() -> void:
	z_index = 0
	_build_shadow()
	_build_sprite()
	_build_feet_collider()
	_build_camera()


func _physics_process(delta: float) -> void:
	var direction := Vector2(
		float(Input.is_key_pressed(KEY_D) or Input.is_key_pressed(KEY_RIGHT)) - float(Input.is_key_pressed(KEY_A) or Input.is_key_pressed(KEY_LEFT)),
		float(Input.is_key_pressed(KEY_S) or Input.is_key_pressed(KEY_DOWN)) - float(Input.is_key_pressed(KEY_W) or Input.is_key_pressed(KEY_UP))
	).normalized()
	velocity = direction * SPEED
	move_and_slide()
	position = position.round()
	_animate(direction, delta)


func reset_to(world_position: Vector2) -> void:
	position = world_position
	velocity = Vector2.ZERO


func feet_y() -> float:
	return global_position.y + 6.0


func _build_shadow() -> void:
	var shadow := Polygon2D.new()
	shadow.name = "FootShadow"
	shadow.color = Color(0.01, 0.03, 0.06, 0.45)
	shadow.polygon = PackedVector2Array([
		Vector2(-11, 4), Vector2(-7, 1), Vector2(7, 1), Vector2(11, 4),
		Vector2(7, 7), Vector2(-7, 7),
	])
	add_child(shadow)


func _build_sprite() -> void:
	sprite = Sprite2D.new()
	sprite.name = "NoctSprite"
	sprite.texture = load("res://dist/noct-walk-4dir.png")
	sprite.hframes = 4
	sprite.vframes = 3
	sprite.frame_coords = Vector2i(0, 0)
	sprite.position = Vector2(0, -24)
	sprite.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	add_child(sprite)


func _build_feet_collider() -> void:
	var collider := CollisionShape2D.new()
	collider.name = "FeetCollider"
	var shape := CapsuleShape2D.new()
	shape.radius = 6.0
	shape.height = 12.0
	collider.shape = shape
	collider.position = Vector2(0, 3)
	add_child(collider)


func _build_camera() -> void:
	camera = Camera2D.new()
	camera.name = "FollowCamera"
	camera.position = Vector2(0, -28)
	camera.limit_left = 0
	camera.limit_top = 0
	camera.limit_right = int(NoctMapDefinitions.WORLD_SIZE.x)
	camera.limit_bottom = int(NoctMapDefinitions.WORLD_SIZE.y)
	camera.position_smoothing_enabled = false
	add_child(camera)


func _animate(direction: Vector2, delta: float) -> void:
	if direction == Vector2.ZERO:
		animation_clock = 0.0
		sprite.frame_coords.x = 0
		return
	last_direction = direction
	animation_clock += delta
	sprite.frame_coords.x = int(animation_clock * 8.0) % 4
	if abs(direction.x) > abs(direction.y):
		sprite.frame_coords.y = 2
		sprite.flip_h = direction.x < 0.0
	elif direction.y < 0.0:
		sprite.frame_coords.y = 1
		sprite.flip_h = false
	else:
		sprite.frame_coords.y = 0
		sprite.flip_h = false
