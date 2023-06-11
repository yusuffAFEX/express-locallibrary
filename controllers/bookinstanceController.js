const BookInstance = require("../models/bookinstance");
const { body, validationResult } = require("express-validator");
const Book = require("../models/book");
const asyncHandler = require("express-async-handler");


// Display list of all BookInstances.
const bookinstance_list = asyncHandler(async (req, res, next) => {
    const allBookInstances = await BookInstance.find().populate("book").exec();

    res.render("bookinstance_list", {
        title: "Book Instance List",
        bookinstance_list: allBookInstances,
    });
});

// Display detail page for a specific BookInstance.
const bookinstance_detail = asyncHandler(async (req, res, next) => {
    const bookInstance = await BookInstance.findById(req.params.id)
        .populate("book")
        .exec();

    if (bookInstance === null) {
        // No results.
        const err = new Error("Book copy not found");
        err.status = 404;
        return next(err);
    }

    res.render("bookinstance_detail", {
        title: "Book:",
        bookinstance: bookInstance,
    });
});



// // Display list of all BookInstances.
// exports.bookinstance_list = asyncHandler(async (req, res, next) => {
//     res.send("NOT IMPLEMENTED: BookInstance list");
// });
//
// // Display detail page for a specific BookInstance.
// exports.bookinstance_detail = asyncHandler(async (req, res, next) => {
//     res.send(`NOT IMPLEMENTED: BookInstance detail: ${req.params.id}`);
// });

// Display BookInstance create form on GET.
const bookinstance_create_get = asyncHandler(async (req, res, next) => {
    const allBooks = await Book.find({}, "title").exec();

    res.render("bookinstance_form", {
        title: "Create BookInstance",
        book_list: allBooks,
    });
});

// Handle BookInstance create on POST.
const bookinstance_create_post = [
    // Validate and sanitize fields.
    body("book", "Book must be specified").trim().isLength({ min: 1 }).escape(),
    body("imprint", "Imprint must be specified")
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body("status").escape(),
    body("due_back", "Invalid date")
        .optional({ values: "falsy" })
        .isISO8601()
        .toDate(),

    // Process request after validation and sanitization.
    asyncHandler(async (req, res, next) => {
        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a BookInstance object with escaped and trimmed data.
        const bookInstance = new BookInstance({
            book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back,
        });

        if (!errors.isEmpty()) {
            // There are errors.
            // Render form again with sanitized values and error messages.
            const allBooks = await Book.find({}, "title").exec();

            res.render("bookinstance_form", {
                title: "Create BookInstance",
                book_list: allBooks,
                selected_book: bookInstance.book._id,
                errors: errors.array(),
                bookinstance: bookInstance,
            });
            return;
        } else {
            // Data from form is valid
            await bookInstance.save();
            res.redirect(bookInstance.url);
        }
    }),
];

// Display Author delete form on GET.
const bookinstance_delete_get = asyncHandler(async (req, res, next) => {
    // Get details of author and all their books (in parallel)
    const [bookinstance] = await Promise.all([
        BookInstance.findById(req.params.id).exec(),
    ]);

    if (bookinstance === null) {
        // No results.
        res.redirect("/catalog/bookinstances");
    }

    res.render("bookinstance_delete", {
        title: "Delete BookInstnace",
        bookinstance: bookinstance,
    });
});

// Handle Author delete on POST.
const bookinstance_delete_post = asyncHandler(async (req, res, next) => {
    // Get details of author and all their books (in parallel)
    const [bookinstance] = await Promise.all([
        BookInstance.findById(req.params.id).exec(),
    ]);



        // Author has no books. Delete object and redirect to the list of authors.
        await BookInstance.findByIdAndRemove(req.body.bookinstanceid);
        res.redirect("/catalog/bookinstances");

});
// Display bookinstance update form on GET.
const bookinstance_update_get = asyncHandler(async (req, res, next) => {
    // Get book, authors and genres for form.
    const [bookinstance, allBooks] = await Promise.all([
        BookInstance.findById(req.params.id).populate("book").exec(),
        Book.find().exec(),
    ]);

    if (bookinstance === null) {
        // No results.
        const err = new Error("Book Instance not found");
        err.status = 404;
        return next(err);
    }

    // Mark our selected genres as checked.
    // for (const genre of allGenres) {
    //     for (const book_g of book.genre) {
    //         if (genre._id.toString() === book_g._id.toString()) {
    //             genre.checked = "true";
    //         }
    //     }
    // }
    res.render("bookinstance_form", {
        title: "Update BookInstance",
        book_list: allBooks,
        selected_book: bookinstance.book._id,
        bookinstance: bookinstance,
    });
});

// Handle book update on POST.
const bookinstance_update_post = [
    // Convert the genre to an array.
    // (req, res, next) => {
    //     if (!(req.body.genre instanceof Array)) {
    //         if (typeof req.body.genre === "undefined") {
    //             req.body.genre = [];
    //         } else {
    //             req.body.genre = new Array(req.body.genre);
    //         }
    //     }
    //     next();
    // },

    // Validate and sanitize fields.
    body("book", "Book must be specified").trim().isLength({ min: 1 }).escape(),
    body("imprint", "Imprint must be specified")
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body("status").escape(),
    body("due_back", "Invalid date")
        .optional({ values: "falsy" })
        .isISO8601()
        .toDate(),

    // Process request after validation and sanitization.
    asyncHandler(async (req, res, next) => {
        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a Book object with escaped/trimmed data and old id.
        const bookinstance = new BookInstance({
            book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back,
            _id: req.params.id, // This is required, or a new ID will be assigned!
        });

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/error messages.

            // Get all authors and genres for form
            const [allBooks] = await Promise.all([
                Book.find().exec()
            ]);

            // Mark our selected genres as checked.
            // for (const genre of allGenres) {
            //     if (book.genre.indexOf(genres._id) > -1) {
            //         genre.checked = "true";
            //     }
            // }
            res.render("bookinstance_form", {
                title: "Update BookInstance",
                authors: allBooks,
                bookinstance: bookinstance,
                selected_book: bookinstance.book._id,
                errors: errors.array(),
            });
            return;
        } else {
            // Data from form is valid. Update the record.
            await BookInstance.findByIdAndUpdate(req.params.id, bookinstance, {});
            // Redirect to book detail page.
            res.redirect(bookinstance.url);
        }
    }),
];

module.exports = {
    bookinstance_list,
    bookinstance_detail,
    bookinstance_create_post,
    bookinstance_create_get,
    bookinstance_delete_get,
    bookinstance_delete_post,
    bookinstance_update_post,
    bookinstance_update_get,
}