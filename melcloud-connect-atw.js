var https = require('https'),
    urllib = require("url");
 
const {  Melcloud } = require("./melcloud-atw.js");



module.exports = function(RED) {

    
    function MelCloudCredentials(n) {
        RED.nodes.createNode(this, n);

        var node = this;
        this.email = n.email;
        this.password = n.password;
        
    }

    RED.nodes.registerType("melcloud-credential-atw", MelCloudCredentials);
    


    function MelCloudDeviceNode(n) {
        RED.nodes.createNode(this, n);

        var node=this;
        node.deviceid = n.deviceid;
        node.buildingid = n.buildingid;

        node.settemperaturezone1 = n.settemperaturezone1;
        node.settemperaturezone2 = n.settemperaturezone2;
        node.settanktemperature = n.settanktemperature;
        node.forcehotwatermode = n.forcehotwatermode;

        node.credentials = RED.nodes.getNode(n.server);


        node.email = node.credentials.email;
        node.password = node.credentials.password;
        
        function fetchDeviceData() {
           
            var melcloud =  new Melcloud(node.email,node.password);

            melcloud.getContext()
                .then(
                   async () =>  { 


                        
                        var d = node.deviceid;
                        if ( node.input_deviceid != null) {
                            d = node.input_deviceid;
                        }


                        var b = node.buildingid;
                        if ( node.input_buildingid != null) {
                            b = node.input_buildingid;
                        }
                        

                        var t1 = node.settemperaturezone1;
                        if ( node.input_settemperaturezone1 != null) {
                            t1 = node.input_settemperaturezone1;
                        }

                        var t2 = node.settemperaturezone2;
                        if ( node.input_settemperaturezone2 != null) {
                            t2 = node.input_settemperaturezone2;
                        }

                        var tt = node.settanktemperature;
                        if ( node.input_settanktemperature != null) {
                            tt = node.input_settanktemperature;
                        }
                        var hwm = node.forcehotwatermode;
                        if ( node.input_forcehotwatermode != null) {
                            hwm = node.input_forcehotwatermode;
                        }




                                                
                        await melcloud.getDeviceInfo( d, b )
                        .then(async device => {
                           var blnUpdated = false;
                           if (t1 && t1 !== "") {
                                console.log("set temperature zone 1= " + t1);
                                device = setTemperatureZone1(device, t1);
                                blnUpdated = true;

                            }
                           if (t2 && t2 !== "") {
                                console.log("set temperature zone 2= " + t2);
                                device = setTemperatureZone2(device, t2);
                                blnUpdated = true;

                            }

                           if (tt && tt !== "") {
                                console.log("set temperature tank = " + tt);
                                device = setTankTemperature(device, tt);
                                blnUpdated = true;

                            }
                           if (hwm && hwm !== "") {
                                console.log("force hot water mode = " + hwm);
                                device = ForcedHotWaterMode(device, hwm);
                                blnUpdated = true;

                            }





                            
                            


                            if (blnUpdated) {
                                device = await melcloud.putDeviceInfo(device);
                                node.send(device);
                                node.status({ text: "Temp : " + device.payload.RoomTemperature + " °C"});
                                return; 
                            }

                            node.send(device);
                            node.status({ text: "Temp : " + device.payload.RoomTemperature  + " °C"});
                        }).catch(err => {
                            node.error(err);
                            node.status({ fill: "red", shape: "dot", text: err });
                            return;
                        });
                }).catch(msg => {
                    node.error(msg.error);
                    node.status({ fill: "red", shape: "dot", text: "error" });
                    return;
                });
          
            
            }

            node.on("close", function(){
            
            });

            node.on("input", function(msg){

                node.input_deviceid = null;
                node.input_building = null;
                node.input_settemperaturezone1 = null;
                node.input_settemperaturezone2 = null;
                node.input_settanktemperature = null;
                node.input_forcehotwatermode = null;
               

                if (msg.hasOwnProperty("device")) {
                    if (msg.device.hasOwnProperty("deviceid")) {
                        node.input_deviceid = msg.device.deviceid;
                    }
                    if (msg.device.hasOwnProperty("buildingid")) {
                        node.input_buildingid = msg.device.buildingid;
                    }

                    if (msg.device.hasOwnProperty("command")) {


                        if (msg.device.command.hasOwnProperty("temperaturezone1")) {
                            node.input_settemperaturezone1 = msg.device.command.temperaturezone1;
                        }
                        if (msg.device.command.hasOwnProperty("temperaturezone2")) {
                            node.input_settemperaturezone2 = msg.device.command.temperaturezone2;
                        }
                        if (msg.device.command.hasOwnProperty("temperaturetank")) {
                            node.input_settanktemperature = msg.device.command.temperaturetank;
                        }
                        if (msg.device.command.hasOwnProperty("forcehotwatermode")) {
                            node.input_forcehotwatermode = msg.device.command.forcehotwatermode;
                        }





                    }
                } 

              
               


                fetchDeviceData();
            });
    }

    RED.nodes.registerType("melcloud-device-atw", MelCloudDeviceNode);
    


    function MelCloudConnectNode(n) {

        RED.nodes.createNode(this, n);

        var node = this;
        node.credentials = RED.nodes.getNode(n.server);

        node.email = node.credentials.email;
        node.password = node.credentials.password;
        

        function fetchData() {
           
            var melcloud =  new Melcloud(node.email,node.password);

            melcloud.getContext()
                .then(
                    () =>  { 
                            melcloud.getListDevices()
                            .then(list => {
                                node.send(list);
                                node.status({});
                            }).catch(msg => {
                                node.error(msg.error);
                                node.status({ fill: "red", shape: "dot", text: "error" });
                                return;
                            });
                }).catch(msg => {
                    node.error(msg.error);
                    node.status({ fill: "red", shape: "dot", text: "error" });
                    return;
                });
          
            
            }

            node.on("close", function(){
            
            });

            node.on("input", function(){
                fetchData();
            });

        
    }

    function setTemperatureZone1(device, temperaturezone1) {

        device.payload.SetTemperatureZone1 = Number.parseFloat(temperaturezone1);
        device.payload.HasPendingCommand = true;
        device.payload.EffectiveFlags = device.payload.EffectiveFlags + 8589934720;
        
        return device;

    }

    function setTemperatureZone2(device, temperaturezone2) {

        device.payload.SetTemperatureZone2 = Number.parseFloat(temperaturezone2);
        device.payload.HasPendingCommand = true;
        device.payload.EffectiveFlags = device.payload.EffectiveFlags + 34359738880;
        
        return device;

    }

    function setTankTemperature(device, tanktemperature) {

        device.payload.SetTankWaterTemperature = Number.parseFloat(tanktemperature);
        device.payload.HasPendingCommand = true;
        device.payload.EffectiveFlags = device.payload.EffectiveFlags + 281474976710688;
        
        return device;

    }



    function ForcedHotWaterMode(device, forcehotwatermode) {

        device.payload.ForcedHotWaterMode = forcehotwatermode;
        device.payload.HasPendingCommand = true;
        device.payload.EffectiveFlags = device.payload.EffectiveFlags + 65536;
        return device;

    }

    function OperationModeZone1(device, operationmodezone1) {

        device.payload.OperationModeZone1 = operationmodezone1;
        device.payload.HasPendingCommand = true;
        device.payload.EffectiveFlags = device.payload.EffectiveFlags + 8;
        return device;

    }

    function OperationModeZone2(device, operationmodezone2) {

        device.payload.OperationModeZone2 = operationmodezone2;
        device.payload.HasPendingCommand = true;
        device.payload.EffectiveFlags = device.payload.EffectiveFlags + 16;
        return device;

    }

    function SetHeatFlowTemperatureZone1(device, setheatflowtemperaturezone1) {

        device.payload.SetHeatFlowTemperatureZone1 = setheatflowtemperaturezone1;
        device.payload.HasPendingCommand = true;
        device.payload.EffectiveFlags = device.payload.EffectiveFlags + 281474976710656;
        return device;

    }

    function SetHeatFlowTemperatureZone2(device, setheatflowtemperaturezone2) {

        device.payload.SetHeatFlowTemperatureZone2 = setheatflowtemperaturezone2;
        device.payload.HasPendingCommand = true;
        device.payload.EffectiveFlags = device.payload.EffectiveFlags + 281474976710656;
        return device;

    }

    function SetCoolFlowTemperatureZone2(device, setcoolflowtemperaturezone2) {

        device.payload.SetCoolFlowTemperatureZone2 = setcoolflowtemperaturezone2;
        device.payload.HasPendingCommand = true;
        device.payload.EffectiveFlags = device.payload.EffectiveFlags + 281474976710656;
        return device;

    }

    function SetCoolFlowTemperatureZone1(device, setcoolflowtemperaturezone1) {

        device.payload.SetCoolFlowTemperatureZone1 = setcoolflowtemperaturezone1;
        device.payload.HasPendingCommand = true;
        device.payload.EffectiveFlags = device.payload.EffectiveFlags + 281474976710656;
        return device;

    }

    function Power(device, power) {

        device.payload.Power = power;
        device.payload.HasPendingCommand = true;
        device.payload.EffectiveFlags = device.payload.EffectiveFlags + 1;
        return device;

    }

    function EcoHotWater(device, ecohotwater) {

        device.payload.EcoHotWater = ecohotwater;
        device.payload.HasPendingCommand = true;
        device.payload.EffectiveFlags = device.payload.EffectiveFlags + 4;
        return device;

    }

    function HolidayMode(device, holydaymode) {

        device.payload.HolydayMode = holydaymode;
        device.payload.HasPendingCommand = true;
        device.payload.EffectiveFlags = device.payload.EffectiveFlags + 131072;
        return device;

    }


/*
        "EffectiveFlags": {
            "Power": 1, ok
            "OperationMode": 2,
            "EcoHotWater": 4, ok
            "OperationModeZone1": 8, ok
            "OperationModeZone2": 16, ok
            "SetTankWaterTemperature": 32, ok
            "Prohibit": 64,
            "TargetHCTemperatureZone1": 128,
            "TargetHCTemperatureZone2": 512,
            "ForcedHotWaterMode": 65536, ok
            "HolidayMode": 131072, ok
            "ProhibitHotWater": 262144,
            "ProhibitHeatingZone1": 524288,
            "ProhibitCoolingZone1": 1048576,
            "ProhibitHeatingZone2": 2097152,
            "ProhibitCoolingZone2": 4194304,
            "Demand": 67108864,
            "SetTemperatureZone1": 8589934720, ok
            "SetTemperatureZone2": 34359738880, ok
            "ThermostatTemperatureZone1": 8589934592,
            "ThermostatTemperatureZone2": 34359738368,
            "SetHeatFlowTemperatureZone1": 281474976710656, ok
            "SetHeatFlowTemperatureZone2": 281474976710656, ok
            "SetCoolFlowTemperatureZone1": 281474976710656, ok
            "SetCoolFlowTemperatureZone2": 281474976710656, ok
            "All": 281483566710825
        }

*/
    RED.nodes.registerType("melcloud-connect-atw", MelCloudConnectNode);

};
