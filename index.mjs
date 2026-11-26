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

app.get("/author/new", (req, res) => {
    res.render("newAuthor");
});

app.post("/author/new", async function(req, res) { //app.post for html action POST.  async function no =>
    let fName = req.body.fName; //info sent to request body so use req.body
    let lName = req.body.lName;
    let birthDate = req.body.birthDate;
    let deathDate = req.body.deathDate;
    let sex = req.body.sex;
    let job = req.body.job;
    let country = req.body.country;
    let picLink = req.body.picLink;
    let bio = req.body.bio;
    let sql = `INSERT INTO q_authors
                (firstName, lastName, dob, dod, sex, profession, 
                country, protrait, biography)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    let sqlParams = [fName, lName, birthDate, deathDate, sex, job, country, picLink, bio];
    const [rows] = await conn.query(sql, sqlParams);  //last lab had sqlParams. note to self: consider a naming convention for this
    res.render("newAuthor", {"message": "Author added!"});
});

app.get("/author/edit", async function(req, res){
 let authorId = req.query.authorId;
 let sql = `SELECT *, 
            DATE_FORMAT(dob, '%Y-%m-%d') dobISO,
            DATE_FORMAT(dod, '%Y-%m-%d') dodISO
            FROM q_authors
            WHERE authorId =  ${authorId}`;
 const [rows] = await conn.query(sql);
 res.render("editAuthor", {"authorInfo":rows});
});

app.post("/author/edit", async function(req, res){
  let sql = `UPDATE q_authors
            SET firstName = ?,
                lastName = ?,
                dob = ?,
                sex = ?
            WHERE authorId =  ?`;
  let params = [req.body.fName,  
              req.body.lName, req.body.dob, 
              req.body.sex,req.body.authorId];         
  const [rows] = await conn.query(sql,params);
  res.redirect("/authors");
});

app.get("/author/delete", async function(req, res) {
    let authorId = req.query.authorId;
    let sql = `DELETE
                FROM q_authors
                WHERE authorId = ?`;
    const [rows] = await conn.query(sql, [authorId]);
    res.redirect("/authors");
});

app.get("/authors", async function(req, res) {
    let sql = `SELECT *
                FROM q_authors
                ORDER BY lastName`;
    const [rows] = await conn.query(sql);
    res.render("authorList", {"authors": rows});
});

app.get("/quote/new", (req, res) => {
    res.render("newQuote");
})

app.post("/quote/new", async function(req, res) {
    let quote = req.body.quote;
    let category = req.body.category;
    let likes = req.body.likes;
    let fName = req.body.fName;
    let lName = req.body.lName;

    //add author
    let sql = `INSERT INTO q_authors
                (firstName, lastName)
                VALUES (?, ?)`;
    let sqlParams = [fName, lName];
    const [authorResult] = await conn.query(sql, sqlParams);
    let authorId = authorResult.insertId; // id gets created

    //add quote
    let sql1 = `INSERT INTO q_quotes
                (quote, category, likes, authorId)
                VALUES (?, ?, ?, ?)`;
    let sqlParams1 = [quote, category, likes, authorId];
    const [rows] = await conn.query(sql1, sqlParams1);
    res.render("newQuote", {"message": "Quote added!"});
});

app.get("/quotes", async function(req, res) {
    let sql = `SELECT *
                FROM q_quotes
                ORDER BY authorId`;
    const [rows] = await conn.query(sql);
    res.render("quoteList", {"quotes": rows});
});

app.get("/quote/edit", async function(req, res) {
     let quoteId = req.query.quoteId;
     let sql = `SELECT * 
        FROM q_quotes
        WHERE quoteId =  ?`;
    const [rows] = await conn.query(sql, [quoteId]);
    res.render("editQuote", {"quoteInfo":rows});
});

app.post("/quote/edit", async function(req, res){
  let sql = `UPDATE q_quotes
            SET quote = ?,
                category = ?,
                likes = ?
            WHERE quoteId =  ?`;
  let params = [req.body.quote,  
              req.body.category, req.body.likes, 
              req.body.quoteId];         
  const [rows] = await conn.query(sql, params);
  res.redirect("/quotes");
});

app.get("/quote/delete", async function(req, res) {
    let quoteId = req.query.quoteId;
    let sql = `DELETE
                FROM q_quotes
                WHERE quoteId = ?`;
    const [rows] = await conn.query(sql, [quoteId]);
    res.redirect("/quotes");
});

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