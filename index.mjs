import express from 'express';
import mysql from 'mysql2/promise';

const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));

//for Express to get values using POST method
app.use(express.urlencoded({extended:true}));

//setting up database connection 
const conn = mysql.createPool({
    host: "d6q8diwwdmy5c9k9.cbetxkdyhwsb.us-east-1.rds.amazonaws.com",
    user: "iuhr83if1xo27cjc",
    password: "ev74qgtok1ap7v8v",
    database: "is4ynyg0rdoieo1v",
    connectionLimit: 10,
    waitForConnections: true
});

//routes

//route to newAuthor.ejs
app.get("/author/new", (req, res) => {  // reminder "/author/new" is the action in .ejs file
    res.render("newAuthor");
});

//INSERT new author data in q_authors
app.post("/author/new", async function(req, res) { //app.post for html action POST.  async function no =>
    //let names must match html names
    let fName = req.body.fName; //info sent to request body so use req.body
    let lName = req.body.lName;
    let dob = req.body.dob;
    let dod = req.body.dod;
    let sex = req.body.sex;
    let job = req.body.job;
    let country = req.body.country;
    let picLink = req.body.picLink;
    let bio = req.body.bio;
    let sql = `INSERT INTO q_authors
                (firstName, lastName, dob, dod, sex, profession, 
                country, portrait, biography)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    let sqlParams = [fName, lName, dob, dod, sex, job, country, picLink, bio]; //these variables must match the let ### variables
    const [rows] = await conn.query(sql, sqlParams);  //last lab had sqlParams. note to self: consider a naming convention for this
    res.render("newAuthor", {"message": "Author added!"}); //message pops up. needs helper in html side     <% if (typeof message != "undefined"){ %>
  		                                                                                                    // <h3><%=message%></h3>
                                                                                                            // <% } %>
});

//routes to editAuthor.ejs and prefills current data into form
app.get("/author/edit", async function(req, res){
 let authorId = req.query.authorId;
 //mySQL syntax for formatting dates
 //dobISO is a variable that gets used on html side
 let sql = `SELECT *, 
            DATE_FORMAT(dob, '%Y-%m-%d') dobISO, 
            DATE_FORMAT(dod, '%Y-%m-%d') dodISO
            FROM q_authors
            WHERE authorId =  ${authorId}`;
 const [rows] = await conn.query(sql);
 res.render("editAuthor", {"authorInfo":rows});  
});

//UPDATEs q_author table in editAuthor.ejs 
//and redirects to authorList.ejs when submitted 
app.post("/author/edit", async function (req, res){
  let sql = `UPDATE q_authors
            SET firstName = ?,
                lastName = ?,
                dob = ?,
                dod = ?,
                sex = ?,
                profession = ?,
                country = ?,
                portrait = ?,
                biography = ?
            WHERE authorId = ?`;
  //must match original variables used & contain all sql params or won't compile
  let params = [req.body.fName,  
              req.body.lName, req.body.dob,
              req.body.dod, req.body.sex, req.body.job,
              req.body.country, req.body.picLink,
              req.body.bio, req.body.authorId];         
  const [rows] = await conn.query(sql, params);
  res.redirect("/authors");  // redirect use the action of <form> "<form action="/authors">"
});

//DELETE author from table when button pressed and reloads the authorList.ejs
app.get("/author/delete", async function(req, res) {
    let authorId = req.query.authorId; //use ids for DELETES
    let sql = `DELETE
                FROM q_authors
                WHERE authorId = ?`;
    const [rows] = await conn.query(sql, [authorId]);
    res.redirect("/authors"); // redirect use the action of <form> "<form action="/authors">"
});

//GETs all authors to display in authorList.ejs and routes
app.get("/authors", async function(req, res) {
    let sql = `SELECT *
                FROM q_authors
                ORDER BY lastName`;
    const [rows] = await conn.query(sql);
    res.render("authorList", {"authors": rows}); //.render use .ejs title
});

//routes to add quote page, newQuote.ejs
app.get("/quote/new", async function(req, res) {
    //for author dropdown
    let sql = `SELECT authorId, firstName, lastName 
                FROM q_authors`;
    const [authorNames] = await conn.query(sql);
    //for category dropdown
    let sql1 = `SELECT DISTINCT category 
                FROM q_quotes`; 
    const [categories] = await conn.query(sql1);                      
    res.render("newQuote", {"authors": authorNames, "categories": categories});
})

//INSERTs new quote with in newQuote.ejs
app.post("/quote/new", async function(req, res) {
    let quote = req.body.quote;
    let category = req.body.category;
    let likes = req.body.likes;
    let authorId = req.body.authorId;

    //add quote
    let sql1 = `INSERT INTO q_quotes
                (quote, category, likes, authorId)
                VALUES (?, ?, ?, ?)`;
    let sqlParams1 = [quote, category, likes, authorId];
    const [rows] = await conn.query(sql1, sqlParams1);
    //reload dropdown menus
    const [authorNames] = await conn.query(`SELECT authorId, firstName, lastName FROM q_authors`);
    const [categories] = await conn.query(`SELECT DISTINCT category FROM q_quotes`);
    res.render("newQuote", {"message": "Quote added!", "authors": authorNames, "categories": categories});
});

//routes to quoteList.ejs and pulls all quotes in table
app.get("/quotes", async function(req, res) {
    let sql = `SELECT *
                FROM q_quotes
                ORDER BY authorId`;
    const [rows] = await conn.query(sql);
    res.render("quoteList", {"quotes": rows});
});

//routes to editQuote.ejs and prefills data in form
app.get("/quote/edit", async function(req, res) {
     let quoteId = req.query.quoteId;
     //for author dropdown
     let sql = `SELECT authorId, firstName, lastName 
                FROM q_authors`;
     const [authorNames] = await conn.query(sql);
     //for category dropdown
     let sql1 = `SELECT DISTINCT category 
                 FROM q_quotes`; 
     const [categories] = await conn.query(sql1);
     let sql2 = `SELECT * 
                 FROM q_quotes
                 WHERE quoteId =  ?`;
    const [rows] = await conn.query(sql2, [quoteId]);
    res.render("editQuote", {"quoteInfo":rows, "authors": authorNames, "categories": categories});
});

//UPDATES q_quotes table and when submitted routes to quoteList.ejs
app.post("/quote/edit", async function(req, res){
  let sql = `UPDATE q_quotes
             SET quote = ?,
                authorId = ?,
                category = ?,
                likes = ?
             WHERE quoteId =  ?`;
  let params = [req.body.quote, req.body.authorId, 
              req.body.category, req.body.likes, 
              req.body.quoteId];         
  const [rows] = await conn.query(sql, params);
  res.redirect("/quotes");
});

//DELETES quote and reloads quoteList.ejs
app.get("/quote/delete", async function(req, res) {
    let quoteId = req.query.quoteId; //use ids for DELETES
    let sql = `DELETE
                FROM q_quotes
                WHERE quoteId = ?`;
    const [rows] = await conn.query(sql, [quoteId]);
    res.redirect("/quotes");
});

//routes to index.ejs
app.get('/', (req, res) => {
   res.render('index');
});

/*//dbTest without try catch
app.get("/dbTest", async(req, res) =>  {
    let sql = "SELECT * FROM q_authors"; //will change for different tables
    const [rows] = await conn.query(sql);
    res.send(rows);
});
*/

//dbTest with try catch
app.get("/dbTest", async(req, res) => {
   try {
        const [rows] = await conn.query("SELECT * FROM q_authors");
        res.send(rows);
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).send("Database error");
    }
});

app.listen(3000, ()=>{
    console.log("Express server running")
})