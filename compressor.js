module.exports = function(RED) {
    "use strict";

    function compressor(config) {
        RED.nodes.createNode(this, config);

        var node = this;
        //this.topic = config.topic;
        
		//this.topics = {};

        /*this.on("input", function(msg) {
            if( msg.hasOwnProperty("payload") ) {
                var input = Number(msg.payload);

                // handle reset
                if( msg.hasOwnProperty("reset") && msg.reset ) {
                    node.topics = {};

                    msg.payload = 0;
                    node.send(msg);
                }

                // handle input
                else if( !isNaN(input) && isFinite(input) ) {
                    node.topics[msg.topic.toString()] = input;

                    var amount = 0;
                    var sum = Object.keys(node.topics).reduce(function(a, b) {
                        ++amount;
                        return a + node.topics[b];
                    }, 0);

                    msg.payload = sum / amount;

                    // overwrite topic if configured
                    if( node.topic ) {
                        msg.topic = node.topic;
                    }

                    node.send(msg);
                }

                // everything else
                else {
                    node.log("Not a number: " + msg.payload);
                }
            }
        });
		*/
		
		var SUM_MSEC = config.minutes * 60;

		// relativ zur vollen Stunde (0,5,10,15,...)
		//var normalizeTime = true;
		this.on('input', function(msg) {
			//var context = this.context();
			
			// Access the node's context object
			var context = this.context();

			// initialise the counter to 0 if it doesn't exist already
			var count = context.get('count')||0;
			count += 1;

			// store the value back
			context.set('count',count);
			// make it part of the outgoing msg object
			// msg.count = count;
			
			if( msg.hasOwnProperty("payload") ) {
			
				var mypayload = context.get('mypayload')||0;
				var currtime  = Math.round(Date.now()/1000);
				var starttime = context.get('starttime')||0;
				
				mypayload += Number(msg.payload);
				context.set('mypayload',mypayload);
				
				node.send([ msg , null ]);


				if (config.minmax == true) {
					var mypayload_min = context.get('mypayload_min') || Number(msg.payload);
					var mypayload_max = context.get('mypayload_max') || Number(msg.payload);
					if (mypayload_min >= Number(msg.payload)) {
						context.set('mypayload_min', Number(msg.payload));
					}
					if (mypayload_max <= Number(msg.payload)) {
						context.set('mypayload_max', Number(msg.payload));
					}

				}

				//node.log("starttime:" + starttime);
				//node.log("currtime :" + currtime)

				if (currtime >= (starttime+SUM_MSEC) ) {
					//reset starttime
					starttime = currtime;
					context.set('starttime',starttime);

					var msg2 = { payload: Math.round(mypayload/count*100)/100 };
					msg2.topic = config.topic;
					msg2.count = count;

					context.set('count',0);
					context.set('mypayload',0);

					node.send([ null , msg2 ]);

					if (config.minmax == true) {
						var msg2_min = { payload: context.get('mypayload_min') };
						msg2_min.topic = config.topic + "_min";
						node.send([ null , msg2_min ]);
						context.set('mypayload_min',Number(msg.payload));

						var msg2_max = { payload: context.get('mypayload_max') };
						msg2_max.topic = config.topic + "_max";
						node.send([ null , msg2_max ]);
						context.set('mypayload_max',Number(msg.payload));

					}
				}
				else {

				}
			}
		});
	}
    RED.nodes.registerType("compressor", compressor);
};
