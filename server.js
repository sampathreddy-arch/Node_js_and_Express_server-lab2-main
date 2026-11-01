const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
const PORT = process.env.PORT || 3000;
const databasePath = path.join(__dirname, "books.db");

// Allow Express to read JSON request bodies.
app.use(express.json());

let database = null;

// Converts the :bookId text from the URL into a positive whole number.
// Returns null when the value is not a positive whole number.
const parseBookId = (value) => {
    if (!/^\d+$/.test(value)) {
        return null;
    }

    const bookId = Number(value);

    if (!Number.isSafeInteger(bookId) || bookId < 1) {
        return null;
    }

    return bookId;
};

// Checks the request body and returns an error message, or null when it is valid.
const validateBook = (body) => {
    const { title, author, price, pages } = body || {};

    if (typeof title !== "string" || title.trim() === "") {
        return "title must be a non-empty text";
    }

    if (typeof author !== "string" || author.trim() === "") {
        return "author must be a non-empty text";
    }

    if (!Number.isInteger(price) || price < 0) {
        return "price must be a whole number, zero or more";
    }

    if (!Number.isInteger(pages) || pages < 0) {
        return "pages must be a whole number, zero or more";
    }

    return null;
};

// GET /books/ - return every book
app.get("/books/", async (request, response) => {
    try {
        const getBooksQuery = `
            SELECT id, title, author, price, pages
            FROM book
            ORDER BY id;`;

        const booksArray = await database.all(getBooksQuery);
        response.status(200).json(booksArray);
    } catch (error) {
        console.log("Error while fetching all books:", error.message);
        response.status(500).json({ error: "Could not fetch books from the database" });
    }
});

// GET /books/:bookId/ - return one book
app.get("/books/:bookId/", async (request, response) => {
    const bookId = parseBookId(request.params.bookId);

    if (bookId === null) {
        return response.status(400).json({ error: "bookId must be a positive whole number" });
    }

    try {
        const getBookQuery = `
            SELECT id, title, author, price, pages
            FROM book
            WHERE id = ?;`;

        const book = await database.get(getBookQuery, [bookId]);

        if (book === undefined) {
            return response.status(404).json({ error: "Book not found" });
        }

        response.status(200).json(book);
    } catch (error) {
        console.log("Error while fetching one book:", error.message);
        response.status(500).json({ error: "Could not fetch the book from the database" });
    }
});

// POST /books/ - add a new book
app.post("/books/", async (request, response) => {
    const problem = validateBook(request.body);

    if (problem !== null) {
        return response.status(400).json({ error: problem });
    }

    const { title, author, price, pages } = request.body;

    try {
        const addBookQuery = `
            INSERT INTO book (title, author, price, pages)
            VALUES (?, ?, ?, ?);`;

        const result = await database.run(addBookQuery, [
            title.trim(),
            author.trim(),
            price,
            pages
        ]);

        response.status(201).json({
            message: "Book added successfully",
            bookId: result.lastID
        });
    } catch (error) {
        console.log("Error while adding a book:", error.message);
        response.status(500).json({ error: "Could not add the book to the database" });
    }
});

// PUT /books/:bookId/ - update every field of an existing book
app.put("/books/:bookId/", async (request, response) => {
    const bookId = parseBookId(request.params.bookId);

    if (bookId === null) {
        return response.status(400).json({ error: "bookId must be a positive whole number" });
    }

    const problem = validateBook(request.body);

    if (problem !== null) {
        return response.status(400).json({ error: problem });
    }

    const { title, author, price, pages } = request.body;

    try {
        const updateBookQuery = `
            UPDATE book
            SET title = ?, author = ?, price = ?, pages = ?
            WHERE id = ?;`;

        const result = await database.run(updateBookQuery, [
            title.trim(),
            author.trim(),
            price,
            pages,
            bookId
        ]);

        if (result.changes === 0) {
            return response.status(404).json({ error: "Book not found" });
        }

        response.status(200).json({
            message: "Book updated successfully",
            bookId: bookId
        });
    } catch (error) {
        console.log("Error while updating a book:", error.message);
        response.status(500).json({ error: "Could not update the book in the database" });
    }
});

// DELETE /books/:bookId/ - delete a book
app.delete("/books/:bookId/", async (request, response) => {
    const bookId = parseBookId(request.params.bookId);

    if (bookId === null) {
        return response.status(400).json({ error: "bookId must be a positive whole number" });
    }

    try {
        const deleteBookQuery = `
            DELETE FROM book
            WHERE id = ?;`;

        const result = await database.run(deleteBookQuery, [bookId]);

        if (result.changes === 0) {
            return response.status(404).json({ error: "Book not found" });
        }

        response.status(200).json({
            message: "Book deleted successfully",
            bookId: bookId
        });
    } catch (error) {
        console.log("Error while deleting a book:", error.message);
        response.status(500).json({ error: "Could not delete the book from the database" });
    }
});

// Handle unknown routes
app.use((request, response) => {
    response.status(404).json({ error: "Route not found" });
});

// Handle bad JSON and any other unexpected error
app.use((error, request, response, next) => {
    if (error.type === "entity.parse.failed") {
        return response.status(400).json({ error: "Invalid JSON in request body" });
    }

    console.log("Unexpected server error:", error.message);
    response.status(500).json({ error: "Internal server error" });
});

// Open the database once, then start the server
const startServer = async () => {
    try {
        database = await open({
            filename: databasePath,
            driver: sqlite3.Database
        });

        const bookTable = await database.get(
            "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?;",
            ["book"]
        );

        if (bookTable === undefined) {
            throw new Error(
                `The book table was not found in ${databasePath}. Rebuild the database with: sqlite3 books.db < seed.sql`
            );
        }

        console.log(`Connected to SQLite database at ${databasePath}`);

        app.listen(PORT, () => {
            console.log(`Express server running at http://localhost:${PORT}`);
        });
    } catch (error) {
        console.log("Failed to start server:", error.message);
        process.exit(1);
    }
};

startServer();
