var FRIndicator = function()
{
	this.interval = 100;
	this.decay = 0.35;

	this.fr = 6 / (1 - this.decay);
	this.ticks = 0;
	this.next_refresh = 0;
};

FRIndicator.prototype.RecordTick = function()
{
	var now = Date.now();

	if(now >= this.next_refresh)
	{
		this.fr = this.fr * (1 - this.decay) + this.ticks * this.decay;
		this.ticks = 0;
		this.next_refresh = now + this.interval;
	}

	this.ticks ++;
};

FRIndicator.prototype.GetFR = function()
{
	return Math.round(1000.0 / this.interval * this.fr);
};
