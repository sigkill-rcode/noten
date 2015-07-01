var ClientSession = function(container)
	{
		this.context = null;
		this.fri = new FRIndicator();

		this.game_state = new TEngine();
		this.next_game_tick = 0;

		container.appendChild(document.createElement("canvas"));

		container.lastChild.width = this.iwidth;
		container.lastChild.height = this.iheight;

		this.context = container.lastChild.getContext("2d");
		this.context.translate(0.5, 0.5);

		this.context.fillStyle = "#000000";
		this.context.fillRect(0, 0, this.iwidth, this.iheight);

		this.socket = new WebSocket("ws://localhost:4174");
		this.socket.onmessage = function(e)
			{
				console.log(e.data);
			};

		var self = this;
		requestAnimationFrame(function(){ self.MainLoop(self); });
	};

ClientSession.prototype.iwidth = 642;
ClientSession.prototype.iheight = 482;

ClientSession.prototype.game_tick_interval = 1000 / 40;

ClientSession.prototype.MainLoop = function(self)
	{
		self.fri.RecordTick();

		while(true)
		{
			var now = Date.now();
			if(now >= self.next_game_tick)
			{
				self.next_game_tick = now + self.game_tick_interval;
				self.game_state.tick();
			}
			else break;
		}

		self.context.clearRect(0, 0, this.iwidth, this.iheight);

		self.game_state.render(self.context, 0, 0, this.iwidth - 1);

		self.context.fillStyle = "#00ffff";
		self.context.font = "15pt serif";
		self.context.fillText(self.fri.GetFR().toString(), 5, 20);

		requestAnimationFrame(function(){ self.MainLoop(self); });
	};

ClientSession.prototype.HandleKeyEvent = function(e, state)
	{
		if(e.keyCode == 38)
			nt.game_state.l_buttons.up = state;
		else if(e.keyCode == 40)
			nt.game_state.l_buttons.down = state;
		else if(e.keyCode == 32)
			nt.game_state.l_buttons.launch = state;
	};
