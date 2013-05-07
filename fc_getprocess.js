var edge = require('edge');

var getProcessAsync = edge.func({
    source: function(){/*
     //using System;
     using System.Threading.Tasks;
     using System.Collections.Generic;
     using System.Diagnostics;

     public class Startup {
     public async Task<object> Invoke(object input)
     {
         return await Task.Run<object> (async () =>
         {
         IDictionary<string, object> payload = (IDictionary<string,object>)input;
         object[] par = (object[])payload["proclist"];
         Dictionary<string, bool> stats = new Dictionary<string, bool>();

         foreach(string name in par){
         stats.Add(name, false);
         }

         Process[] processlist = Process.GetProcesses();
         foreach(Process theprocess in processlist){
         var fullname = theprocess.ProcessName+".exe";
         if (stats.ContainsKey(fullname)) {stats[fullname]=true;}
         }
         return stats;
         });
     }
     }
     */},
    references: ['System.Data.dll']
});
/*
getProcessAsync({proclist:['server.exe','calc.exe','node.exe']}, function(err,res){
    if (err) {
        console.log(err)
    }
    else {
        console.log(res)
    }
    });
*/
module.exports = {getProcessAsync:getProcessAsync};