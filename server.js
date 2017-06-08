var http = require("http");
var url = require("url");
var mysql = require('mysql');
var fs = require('fs');
var pdfDocument = require('pdfkit');
var path = require('path');


function onRequest(request, response) {
    var pathname = url.parse(request.url).pathname;
    var firstName = pathname.substring(1);

    if (firstName.localeCompare('favicon.ico') !== 0) {
        var connection = mysql.createConnection({
            host     : 'localhost',
            user     : 'root',
            password : 'root'
        });

        connection.connect(function(err) {
            if (err) throw err;
            console.log('Connected!');
        });

        var resultJSON = connection.query("SELECT firstName, lastName, image FROM my_schema.user " +
            "WHERE firstName="+"\'"+firstName+"\'", function(err, rows, fields) {
            if (!err) {

                var result = JSON.stringify(rows);
                var resultJSON = JSON.parse(result);
                var doc = new pdfDocument;
                var fileName = resultJSON[0].firstName+'.pdf';
                var ws = fs.createWriteStream(fileName);

                doc.fontSize(25).text(resultJSON[0].firstName+' '+resultJSON[0].lastName);
                doc.image(Buffer.from(resultJSON[0].image));
                doc.pipe(ws);
                doc.end();

                var buffer = Buffer.from(fs.readFileSync(path.resolve('c:\\Users\\Aleksander\\WebstormProjects\\server\\',fileName)));
                var sql = "UPDATE my_schema.user SET pdf = ? WHERE firstName="+"\'"+resultJSON[0].firstName+"\'";
                var response = connection.query(sql, [buffer], function (err, result) {
                    if (err) throw err;
                    return JSON.stringify(true);
                });

            }
            else {
                console.log('Error while performing Query.');
            }

            return response;
        });
    }

    response.writeHead(200, {"Content-Type": "text/plain"});
    response.write(resultJSON ? JSON.stringify(true) : JSON.stringify(false));
    response.end();
};

http.createServer(onRequest).listen(8080);
console.log("Server has started.");