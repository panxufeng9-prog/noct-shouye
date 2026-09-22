class_name ForegroundOccluder
extends Polygon2D

var player: NoctPlayer
var foot_y := 0.0


func _process(_delta: float) -> void:
	if player == null:
		return
	# When Noct's feet are behind the object, redraw the sampled crown above the
	# actor. When the feet pass the object's base, keep it below the actor.
	z_index = 20 if player.feet_y() < foot_y else -5
