var TEngine = function(old_state)
	{
		if(typeof old_state == "undefined")
		{
			this.frame_index = 0;

			this.reset_needed = false;
			this.waiting = true;
			this.ball_intangible = false;
			this.launch_turn = true;

			this.l_use_ai = false;
			this.r_use_ai = true;

			this.ball_pos = [(this.field_width - this.ball_size) / 2, (this.field_height - this.ball_size) / 2];
			this.ball_vel = [0, 0];

			this.l_paddle_y = this.r_paddle_y = (this.field_height - this.paddle_length) / 2;
			this.l_score = this.r_score = 0;

			this.l_buttons = {up: -1, down: -1, launch: -1};
			this.r_buttons = {up: -1, down: -1, launch: -1};
		}
		else
		{
			this.copyFrom(old_state);
		}
	};

TEngine.prototype.tick_interval = 1000 / 30;

TEngine.prototype.ball_size = 16;
TEngine.prototype.ball_launch_speed = 14;
TEngine.prototype.ball_impact_multiplier = 1.13;
TEngine.prototype.ball_warp = Math.PI / 8;
TEngine.prototype.ball_min_x_vel = 5;

TEngine.prototype.display_width = 642;
TEngine.prototype.display_height = 482;

TEngine.prototype.field_width = TEngine.prototype.display_width - 2;
TEngine.prototype.field_height = TEngine.prototype.display_height - 2;

TEngine.prototype.paddle_length = 50;
TEngine.prototype.paddle_thickness = 10;
TEngine.prototype.l_paddle_x_offset = 12;
TEngine.prototype.r_paddle_x_offset =
	TEngine.prototype.field_width - TEngine.prototype.l_paddle_x_offset - TEngine.prototype.paddle_thickness;
TEngine.prototype.paddle_y_offset = 12;
TEngine.prototype.paddle_speed = 12;

TEngine.prototype.ai_elasticity = 20;

TEngine.prototype.render = function(context, x, y, width)
{
	context.save();

	var scale = width / this.display_width;
	context.translate(x, y);
	context.scale(scale, scale);

	context.fillStyle = "#ffffff";
	context.strokeStyle = "#00ff00";
	context.lineWidth = 2;
	context.font = "30pt serif";
	context.textAlign = "center";

	context.setLineDash([10, 5]);
	context.beginPath();
	context.moveTo(1 + this.field_width / 2, 0);
	context.lineTo(1 + this.field_width / 2, this.field_height);
	context.stroke();

	context.setLineDash([]);
	context.strokeRect(0, 0, this.display_width, this.display_height);

	context.translate(1, 1);
	context.fillRect(this.ball_pos[0], this.ball_pos[1], this.ball_size, this.ball_size);
	context.fillRect(this.l_paddle_x_offset, this.l_paddle_y, this.paddle_thickness, this.paddle_length);
	context.fillRect(this.r_paddle_x_offset, this.r_paddle_y, this.paddle_thickness, this.paddle_length);
	context.fillText(this.l_score.toString(), this.field_width / 4, 40);
	context.fillText(this.r_score.toString(), 3 * this.field_width / 4, 40);

	context.restore();
}

TEngine.prototype.tick = function()
	{
		this.frame_index ++;

		if(this.l_use_ai) this.runAI(true);
		if(this.r_use_ai) this.runAI(false);

		if(this.pressed(true, "up") & !this.pressed(true, "down") && this.l_paddle_y > this.paddle_y_offset)
			this.l_paddle_y -= this.paddle_speed;
		else if(this.pressed(true, "down") && !this.pressed(true, "up") &&
				this.l_paddle_y + this.paddle_length < this.field_height - this.paddle_y_offset)
			this.l_paddle_y += this.paddle_speed;

		if(this.pressed(false, "up") & !this.pressed(false, "down") && this.r_paddle_y > this.paddle_y_offset)
			this.r_paddle_y -= this.paddle_speed;
		else if(this.pressed(false, "down") && !this.pressed(false, "up") &&
				this.r_paddle_y + this.paddle_length < this.field_height - this.paddle_y_offset)
			this.r_paddle_y += this.paddle_speed;

		if(this.reset_needed)
		{
			this.reset_needed = false;
			this.waiting = true;
			this.ball_intangible = false;

			this.ball_pos = [(this.field_width - this.ball_size) / 2, (this.field_height - this.ball_size) / 2];
			this.ball_vel = [0, 0];
		}
		else if(this.waiting)
		{
			if((this.launch_turn && this.pressed(true, "launch")) || (!this.launch_turn && this.pressed(false, "launch")))
			{
				this.waiting = false;
				this.launch_turn = !this.launch_turn;

				this.ball_vel[0] = (2 * this.ball_launch_speed / 3) + (this.ball_launch_speed / 3) * Math.random();
				this.ball_vel[1] = Math.sqrt(this.ball_launch_speed * this.ball_launch_speed - this.ball_vel[0] * this.ball_vel[0]);

				if(!this.launch_turn) this.ball_vel[0] = -this.ball_vel[0];
				if(Math.random() < 0.5) this.ball_vel[1] = -this.ball_vel[1];
			}
		}

		if(!this.waiting)
		{
			this.ball_pos[0] += this.ball_vel[0];
			this.ball_pos[1] += this.ball_vel[1];

			if(this.ball_pos[1] <= 0)
			{
				this.ball_pos[1] = 0;
				this.ball_vel[1] = -this.ball_vel[1];
			}
			else if(this.ball_pos[1] + this.ball_size >= this.field_height)
			{
				this.ball_pos[1] = this.field_height - this.ball_size;
				this.ball_vel[1] = -this.ball_vel[1];
			}

			if(!this.ball_intangible)
			{
				if(this.ball_pos[0] <= this.l_paddle_x_offset + this.paddle_thickness)
				{
					var collision = (this.l_paddle_y <= this.ball_pos[1]) &&
						(this.ball_pos[1] < this.l_paddle_y + this.paddle_length);

					collision |= (this.l_paddle_y < this.ball_pos[1] + this.ball_size) &&
						(this.ball_pos[1] + this.ball_size <= this.l_paddle_y + this.paddle_length);

					if(collision)
					{
						this.ball_pos[0] = this.l_paddle_x_offset + this.paddle_thickness;
						this.ball_vel[0] = -this.ball_vel[0];

						var relative_position = this.ball_size + this.ball_pos[1] - this.l_paddle_y;
						var resultant_angle = 2 * this.ball_warp * (relative_position / (this.ball_size + this.paddle_length));
						resultant_angle -= this.ball_warp;

						var ts = Math.sin(resultant_angle);
						var tc = Math.cos(resultant_angle);

						var new_vel = [tc * this.ball_vel[0] - ts * this.ball_vel[1],
							ts * this.ball_vel[0] + tc * this.ball_vel[1]];

						new_vel[0] = Math.max(new_vel[0] * this.ball_impact_multiplier, this.ball_min_x_vel);

						this.ball_vel = new_vel;
					}
					else if(this.ball_pos[0] <= this.l_paddle_x_offset)
					{
						this.ball_intangible = true;
					}
				}
				else if(this.ball_pos[0] + this.ball_size >= this.r_paddle_x_offset)
				{
					var collision = (this.r_paddle_y <= this.ball_pos[1]) &&
						(this.ball_pos[1] < this.r_paddle_y + this.paddle_length);

					collision |= (this.r_paddle_y < this.ball_pos[1] + this.ball_size) &&
						(this.ball_pos[1] + this.ball_size <= this.r_paddle_y + this.paddle_length);

					if(collision)
					{
						this.ball_pos[0] = this.r_paddle_x_offset - this.ball_size;
						this.ball_vel[0] = -this.ball_vel[0];

						var relative_position = this.ball_size + this.ball_pos[1] - this.r_paddle_y;
						var resultant_angle = 2 * this.ball_warp * (relative_position / (this.ball_size + this.paddle_length));
						resultant_angle -= this.ball_warp;
						resultant_angle = -resultant_angle;

						var ts = Math.sin(resultant_angle);
						var tc = Math.cos(resultant_angle);

						var new_vel = [tc * this.ball_vel[0] - ts * this.ball_vel[1],
							ts * this.ball_vel[0] + tc * this.ball_vel[1]];

						new_vel[0] = Math.min(new_vel[0] * this.ball_impact_multiplier, -this.ball_min_x_vel);

						this.ball_vel = new_vel;
					}
					else if(this.ball_pos[0] + this.ball_size >= this.r_paddle_x_offset + this.paddle_thickness)
					{
						this.ball_intangible = true;
					}
				}
			}

			if(this.ball_pos[0] <= 0)
			{
				this.reset_needed = true;

				this.ball_pos[0] = 0;
				this.r_score ++;
			}
			else if(this.ball_pos[0] + this.ball_size >= this.field_width)
			{
				this.reset_needed = true;

				this.ball_pos[0] = this.field_width - this.ball_size;
				this.l_score ++;
			}
		}
	};

TEngine.prototype.runAI = function(left)
	{
		if(this.waiting && this.launch_turn == left && Math.random() < 0.1)
			this.pressOrRelease(left, "launch", true);
		else
			this.pressOrRelease(left, "launch", false);

		var paddle_middle = (left ? this.l_paddle_y : this.r_paddle_y) + this.paddle_length / 2;
		var ball_middle = this.ball_pos[1] + this.ball_size / 2;

		if(Math.abs(paddle_middle - ball_middle) > this.ai_elasticity)
		{
			if(paddle_middle < ball_middle)
			{
				this.pressOrRelease(left, "down", true);
				this.pressOrRelease(left, "up", false);
			}
			else
			{
				this.pressOrRelease(left, "up", true);
				this.pressOrRelease(left, "down", false);
			}
		}
		else
		{
			this.pressOrRelease(left, "up", false);
			this.pressOrRelease(left, "down", false);
		}
	};

TEngine.prototype.copyFrom = function(old_state)
	{
		this.frame_index = old_state.frame_index;

		this.reset_needed = old_state.reset_needed;
		this.waiting = old_state.waiting;
		this.ball_intangible = old_state.ball_intangible;
		this.launch_turn = old_state.launch_turn;

		this.l_use_ai = old_state.l_use_ai;
		this.r_use_ai = old_state.r_use_ai;

		this.ball_pos = [old_state.ball_pos[0], old_state.ball_pos[1]];
		this.ball_vel = [old_state.ball_vel[0], old_state.ball_vel[1]];

		this.l_paddle_y = old_state.l_paddle_y;
		this.r_paddle_y = old_state.r_paddle_y;

		this.l_score = old_state.l_score;
		this.r_score = old_state.r_score;

		this.l_buttons = {up: old_state.l_buttons.up,
							down: old_state.l_buttons.down,
							launch: old_state.l_buttons.launch};

		this.r_buttons = {up: old_state.r_buttons.up,
							down: old_state.r_buttons.down,
							launch: old_state.r_buttons.launch};
	};

TEngine.prototype.pressed = function(left, id)
	{
		return (left ? this.l_buttons : this.r_buttons)[id] >= this.frame_index;
	};

TEngine.prototype.pressOrRelease = function(left, id, state)
	{
		if(state == this.pressed(left, id))
			return;

		(left ? this.l_buttons : this.r_buttons)[id] = (state ? Infinity : this.frame_index);
	};
