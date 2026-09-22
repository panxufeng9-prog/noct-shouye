class_name NoctMapDefinitions
extends RefCounted

## The source paintings were authored in a 640 x 400 reference space and are
## displayed in a 2048 x 1280 world. Keeping collision data in the small
## reference space makes it easy to compare with the original artwork.
const REFERENCE_SIZE := Vector2(640.0, 400.0)
const WORLD_SIZE := Vector2(2048.0, 1280.0)
const WORLD_SCALE := Vector2(3.2, 3.2)


static func oval(center: Vector2, radius: Vector2) -> Dictionary:
	return {"type": "oval", "center": center, "radius": radius}


static func polygon(points: Array[Vector2]) -> Dictionary:
	return {"type": "polygon", "points": points}


static func occluder(rect: Rect2, foot_y: float) -> Dictionary:
	return {"rect": rect, "foot_y": foot_y}


static func all() -> Dictionary:
	return {
		"moonshadow": {
			"name": "月影森林",
			"texture": "res://art/maps/moonshadow.png",
			"spawn": Vector2(320, 205),
			"solids": [
				oval(Vector2(34, 47), Vector2(27, 23)),
				oval(Vector2(119, 33), Vector2(26, 28)),
				oval(Vector2(544, 34), Vector2(49, 24)),
				oval(Vector2(48, 346), Vector2(47, 37)),
				oval(Vector2(594, 357), Vector2(37, 29)),
				polygon([Vector2(638, 0), Vector2(625, 27), Vector2(616, 61), Vector2(597, 85), Vector2(590, 111), Vector2(619, 114), Vector2(638, 95)]),
				polygon([Vector2(607, 141), Vector2(621, 146), Vector2(621, 180), Vector2(638, 191), Vector2(640, 248), Vector2(621, 224), Vector2(608, 195), Vector2(610, 166)]),
			],
			"occluders": [
				occluder(Rect2(4, 2, 45, 43), 54),
				occluder(Rect2(90, 0, 49, 44), 54),
				occluder(Rect2(7, 278, 91, 59), 365),
				occluder(Rect2(500, 1, 89, 29), 42),
			],
		},
		"wetland": {
			"name": "荧光湿地",
			"texture": "res://art/maps/wetland.png",
			"spawn": Vector2(320, 205),
			"solids": [
				oval(Vector2(32, 42), Vector2(25, 29)),
				oval(Vector2(122, 30), Vector2(25, 29)),
				oval(Vector2(556, 30), Vector2(40, 24)),
				polygon([Vector2(0, 271), Vector2(26, 275), Vector2(40, 302), Vector2(70, 318), Vector2(132, 353), Vector2(126, 400), Vector2(0, 400)]),
				polygon([Vector2(640, 271), Vector2(617, 278), Vector2(610, 303), Vector2(575, 313), Vector2(573, 361), Vector2(600, 389), Vector2(640, 400)]),
				polygon([Vector2(631, 0), Vector2(640, 0), Vector2(640, 89), Vector2(615, 101), Vector2(616, 61)]),
				polygon([Vector2(612, 115), Vector2(640, 102), Vector2(640, 186), Vector2(623, 179), Vector2(610, 146)]),
			],
			"occluders": [
				occluder(Rect2(6, 3, 43, 39), 53),
				occluder(Rect2(91, 0, 49, 45), 55),
			],
		},
		"snowfield": {
			"name": "星落雪原",
			"texture": "res://art/maps/snowfield.png",
			"spawn": Vector2(320, 205),
			"solids": [
				oval(Vector2(26, 51), Vector2(24, 21)),
				oval(Vector2(87, 41), Vector2(19, 22)),
				oval(Vector2(566, 50), Vector2(65, 27)),
				polygon([Vector2(0, 122), Vector2(34, 128), Vector2(56, 155), Vector2(70, 173), Vector2(51, 209), Vector2(61, 231), Vector2(28, 246), Vector2(0, 247)]),
				polygon([Vector2(640, 199), Vector2(616, 202), Vector2(595, 216), Vector2(595, 241), Vector2(623, 260), Vector2(640, 258)]),
				oval(Vector2(238, 97), Vector2(29, 12)),
				oval(Vector2(449, 191), Vector2(23, 13)),
				oval(Vector2(260, 300), Vector2(29, 12)),
				oval(Vector2(27, 354), Vector2(21, 18)),
				oval(Vector2(600, 362), Vector2(23, 16)),
			],
			"occluders": [],
		},
		"ashcanyon": {
			"name": "灰烬峡谷",
			"texture": "res://art/maps/ashcanyon.png",
			"spawn": Vector2(320, 205),
			"solids": [
				oval(Vector2(25, 45), Vector2(25, 24)),
				oval(Vector2(121, 36), Vector2(28, 27)),
				polygon([Vector2(540, 0), Vector2(640, 0), Vector2(640, 102), Vector2(614, 93), Vector2(593, 77), Vector2(557, 66), Vector2(524, 36)]),
				polygon([Vector2(0, 273), Vector2(21, 280), Vector2(55, 304), Vector2(46, 317), Vector2(22, 299), Vector2(0, 290)]),
				polygon([Vector2(0, 341), Vector2(30, 340), Vector2(65, 356), Vector2(102, 374), Vector2(170, 400), Vector2(0, 400)]),
				oval(Vector2(605, 355), Vector2(30, 28)),
				oval(Vector2(201, 116), Vector2(17, 10)),
				oval(Vector2(230, 129), Vector2(15, 8)),
				polygon([Vector2(420, 174), Vector2(431, 171), Vector2(452, 182), Vector2(489, 195), Vector2(486, 210), Vector2(468, 210), Vector2(445, 198), Vector2(421, 190)]),
				oval(Vector2(227, 278), Vector2(22, 12)),
			],
			"occluders": [],
		},
	}


static func shape_to_world(shape: Dictionary, oval_steps := 24) -> PackedVector2Array:
	var result := PackedVector2Array()
	if shape["type"] == "polygon":
		for point: Vector2 in shape["points"]:
			result.append(point * WORLD_SCALE)
		return result
	var center: Vector2 = shape["center"]
	var radius: Vector2 = shape["radius"]
	for index in oval_steps:
		var angle := TAU * float(index) / float(oval_steps)
		result.append((center + Vector2(cos(angle), sin(angle)) * radius) * WORLD_SCALE)
	return result


static func rect_to_world(rect: Rect2) -> PackedVector2Array:
	return PackedVector2Array([
		rect.position * WORLD_SCALE,
		Vector2(rect.end.x, rect.position.y) * WORLD_SCALE,
		rect.end * WORLD_SCALE,
		Vector2(rect.position.x, rect.end.y) * WORLD_SCALE,
	])
