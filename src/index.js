import "dotenv/config"

import express from 'express'
import { auth } from './auth.js'
import { db } from './db.js'
import { linksTable, tagsTable } from './db/schema.js'
import { eq } from 'drizzle-orm'

const app = express()
const port = process.env.PORT

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.set("view engine", "pug")


app.get("/login", (req, res) => {
    let tag = req.query.tag
    res.render("login", {tag})
})

app.get("/register", (req, res) => {
    let tag = req.query.tag
    res.render("register", {tag})
})

app.post("/form/register", async (req, res) => {
    let tag = req.body.tag
    let email = req.body.email
    let name = req.body.name
    let password = req.body.password

    let response = await auth.api.signUpEmail({
        body: {
            email,
            password,
            name,
        },
        asResponse: true,
    })

console.log(process.env.DB_FILE_NAME)
    response.headers.forEach((value, key) => res.setHeader(key, value))
    console.log(response.status)
    if(response.status == 200) {
        res.redirect(`/${tag}`)
    } else {
        res.redirect("/register")
    }
}) 

app.post("/form/login", async (req, res) => {
    let tag = req.body.tag
    let email = req.body.email
    let password = req.body.password

    let response = await auth.api.signInEmail(
        {
            body: {
                email,
                password,
            },
            asResponse: true,
        }
    )

    if(response.status == 200) {
        response.headers.forEach((value, key) => res.setHeader(key, value))
        if(tag) {
            res.redirect(`/${tag}`)
        } else {
            res.redirect("/edit")
        }
        
    } else {
        res.redirect("/login")
    }
})

app.post("/form/assign", async (req, res) => {
    let tag = req.body.tag
    let session = await auth.api.getSession({headers: req.headers})
    if(!session?.user?.id) {
        return res.status(403)
    }
    await db.insert(tagsTable).values({
        id: tag,
        userId: session.user.id,
    })

    res.redirect("/edit")
})

app.get("/edit", async (req, res) => {
    let session = await auth.api.getSession({headers: req.headers})
    if(!session?.user?.id) {
        return res.redirect("/login")
    }
    let userId = session.user.id
    let links = (await db.select().from(linksTable).where(eq(linksTable.userId, userId)))[0]
    res.render("edit", {links: JSON.parse(links?.links ?? "[]")})
})

app.post("/edit", async (req, res) => {
    let session = await auth.api.getSession({headers: req.headers})
    if(!session?.user?.id) {
        return res.redirect("/login")
    }
    let userId = session.user.id
    let links = JSON.stringify(req.body.links)
    await db.insert(linksTable).values({userId: userId, links}).onConflictDoUpdate({target: linksTable.userId, set: {links}})
    res.redirect(`/edit`)
})

app.get("/", async (req, res) => {
    let session = await auth.api.getSession({headers: req.headers})
    if(!session?.user?.id) {
        return res.redirect("/login")
    }
    let userId = session.user.id
    let links = (await db.select().from(linksTable).where(eq(linksTable.userId, userId)))[0]
    res.render("index", {links: JSON.parse(links?.links ?? "[]")})
})

app.get('/:id', async (req, res) => {
    let id = req.params.id
    let tag = (await db.select().from(tagsTable).where(eq(tagsTable.id, id)))[0]
    if(!tag) {
        let session = await auth.api.getSession({headers: req.headers})
        return res.render("assign", {id: id, loggedIn: !!session, userId: session?.user?.id})
    }
    let links = (await db.select().from(linksTable).where(eq(linksTable.userId, tag.userId)))[0]
    res.render("index", {links: JSON.parse(links?.links ?? "[]")})
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

