const Genre = require("../models/genre")
const Book = require("../models/book");
const {body, validationResult} = require("express-validator");
const asyncHandler = require("express-async-handler");

// Display list of all Genre.
const genre_list = asyncHandler(async (req, res, next) => {
    const allGenres = await Genre.find().sort({name: 1}).exec();
    res.render("genre_list", {
        title: "Genre List",
        genre_list: allGenres,
    });
});


// Display detail page for a specific Genre.
const genre_detail = asyncHandler(async (req, res, next) => {
    // Get details of genre and all associated books (in parallel)
    const [genre, booksInGenre] = await Promise.all([
        Genre.findById(req.params.id).exec(),
        Book.find({genre: req.params.id}, "title summary").exec(),
    ]);
    if (genre === null) {
        // No results.
        const err = new Error("Genre not found");
        err.status = 404;
        return next(err);
    }

    res.render("genre_detail", {
        title: "Genre Detail",
        genre: genre,
        genre_books: booksInGenre,
    });
});


// Display Genre create form on GET.
const genre_create_get = (req, res, next) => {
    res.render("genre_form", {title: "Create Genre"});
};


// Handle Genre create on POST.
// Handle Genre create on POST.
const genre_create_post = [
    // Validate and sanitize the name field.
    body("name", "Genre name must contain at least 3 characters")
        .trim()
        .isLength({min: 3})
        .escape(),

    // Process request after validation and sanitization.
    asyncHandler(async (req, res, next) => {
        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a genre object with escaped and trimmed data.
        const genre = new Genre({name: req.body.name});

        if (!errors.isEmpty()) {
            // There are errors. Render the form again with sanitized values/error messages.
            res.render("genre_form", {
                title: "Create Genre",
                genre: genre,
                errors: errors.array(),
            });
            return;
        } else {
            // Data from form is valid.
            // Check if Genre with same name already exists.
            const genreExists = await Genre.findOne({name: req.body.name}).exec();
            if (genreExists) {
                // Genre exists, redirect to its detail page.
                res.redirect(genreExists.url);
            } else {
                await genre.save();
                // New genre saved. Redirect to genre detail page.
                res.redirect(genre.url);
            }
        }
    }),
];

// Display Author delete form on GET.
const genre_delete_get = asyncHandler(async (req, res, next) => {
    // Get details of author and all their books (in parallel)
    const [genre, allBooksByGenre] = await Promise.all([
        Genre.findById(req.params.id).exec(),
        Book.find({genre: req.params.id}, "title summary").exec(),
    ]);

    if (genre === null) {
        // No results.
        res.redirect("/catalog/genres");
    }

    res.render("genre_delete", {
        title: "Delete Genre",
        genre: genre,
        genre_books: allBooksByGenre,
    });
});


// Handle Author delete on POST.
const genre_delete_post = asyncHandler(async (req, res, next) => {
    // Get details of author and all their books (in parallel)
    const [genre, allBooksByGenre] = await Promise.all([
        Genre.findById(req.params.id).exec(),
        Book.find({genre: req.params.id}, "title summary").exec(),
    ]);

    if (allBooksByGenre.length > 0) {
        // Author has books. Render in same way as for GET route.
        res.render("genre_delete", {
            title: "Delete Genre",
            genre: genre,
            genre_books: allBooksByGenre,
        });
        return;
    } else {
        // Author has no books. Delete object and redirect to the list of authors.
        await Genre.findByIdAndRemove(req.body.genreid);
        res.redirect("/catalog/genres");
    }
});


// Display book update form on GET.
const genre_update_get = asyncHandler(async (req, res, next) => {
    // Get book, authors and genres for form.
    const [genre] = await Promise.all([
        Genre.findById(req.params.id).exec(),
    ]);

    if (genre === null) {
        // No results.
        const err = new Error("Genre not found");
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

    res.render("genre_form", {
        title: "Update Genre",
        genre: genre,
    });
});


// Handle book update on POST.
const genre_update_post = [

        // Validate and sanitize the name field.
        body("name", "Genre name must contain at least 3 characters")
            .trim()
            .isLength({min: 3})
            .escape(),

    // Process request after validation and sanitization.
    asyncHandler(async (req, res, next) => {
        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a Book object with escaped/trimmed data and old id.
        const genre = new Genre({
            name: req.body.name,
            _id: req.params.id, // This is required, or a new ID will be assigned!
        });

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/error messages.

            // Get all authors and genres for form
            // const [allAuthors, allGenres] = await Promise.all([
            //     Author.find().exec(),
            //     Genre.find().exec(),
            // ]);

            // Mark our selected genres as checked.
            // for (const genre of allGenres) {
            //     if (book.genre.indexOf(genres._id) > -1) {
            //         genre.checked = "true";
            //     }
            // }
            res.render("genre_form", {
                title: "Update Genre",
                genre: genre,
                errors: errors.array(),
            });
            return;
        } else {
            // Data from form is valid. Update the record.
            const thegenre = await Genre.findByIdAndUpdate(req.params.id, genre, {});
            // Redirect to book detail page.
            res.redirect(thegenre.url);
        }
    }),
];


module.exports = {
    genre_detail,
    genre_list,
    genre_create_get,
    genre_create_post,
    genre_delete_post,
    genre_delete_get,
    genre_update_post,
    genre_update_get,
}