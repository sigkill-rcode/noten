/* Class representing the client side of a Noten session */
var ClientSession = function(container)
	{
		/* container is a DOM element in which the game canvas will be placed */

		/* Canvas drawing context */
		this.context = null;

		/* Framerate indicator */
		this.fri = new FRIndicator();

		this.game_state = new TEngine();
		this.next_game_tick = Date.now();

		/* Create the canvas */
		container.appendChild(document.createElement("canvas"));
		container.lastChild.width = this.iwidth;
		container.lastChild.height = this.iheight;

		/* Create the context; antialiasing hack */
		this.context = container.lastChild.getContext("2d");
		this.context.translate(0.5, 0.5);

		/* Clear the canvas */
		this.context.fillStyle = "#000";
		this.context.fillRect(0, 0, this.iwidth, this.iheight);

		/* Start rendering */
		var self = this;
		requestAnimationFrame(function(){ self.MainLoop(self); });
	};

/* Metrics of the canvas */
ClientSession.prototype.iwidth = 642;
ClientSession.prototype.iheight = 482;

ClientSession.prototype.MainLoop = function(self)
	{
		self.fri.RecordTick();

		var refresh_needed = false;

		while(true)
		{
			var now = Date.now();
			if(now >= self.next_game_tick)
			{
				self.next_game_tick += self.game_state.tick_interval;
				self.game_state.tick();

				refresh_needed = true;
			}
			else break;
		}

		if(refresh_needed)
		{
			self.context.clearRect(0, 0, this.iwidth, this.iheight);

			self.game_state.render(self.context, 0, 0, this.iwidth);

			self.context.fillStyle = "#0ff";
			self.context.font = "15pt serif";
			self.context.fillText(self.fri.GetFR().toString(), 5, 20);
		}

		requestAnimationFrame(function(){ self.MainLoop(self); });
	};

ClientSession.prototype.HandleKeyEvent = function(e, state)
	{
		if(e.keyCode == 38)
			this.game_state.pressOrRelease(true, "up", state);
		else if(e.keyCode == 40)
			this.game_state.pressOrRelease(true, "down", state);
		else if(e.keyCode == 32)
			this.game_state.pressOrRelease(true, "launch", state);
	};
