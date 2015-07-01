var ServerSession = function(id, socket, name)
	{
		this.id = id;
		this.socket = socket;
		this.name = name;
	};

module.exports = {"ServerSession": ServerSession};
