const itemsPerPage = 18; 
const maxPagesToShow = 3; // Set the maximum number of pages to display

class PhimmoiController {
    static index(req, res) {
        const page = parseInt(req.query.page) || 1; // Default to page 1 if undefined

        Promise.all([PhimmoiController.phimmoi(page), PhimmoiController.phimmoi(page + 1)])
            .then(([moviesPage1, moviesPage2]) => {
                const allMovies = [...moviesPage1, ...moviesPage2];
                const displayedMovies = allMovies.slice(0, itemsPerPage); 

                const totalItems = moviesPage1.length + moviesPage2.length;
                const totalPages = page+1;
                const pagination = [];
                const startPage = Math.max(1, page - Math.floor(maxPagesToShow / 2));
                const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
                
                for (let i = startPage; i <= endPage; i++) {
                    pagination.push(i);
                }

                res.render("movie/listmovie", {
                    movies: displayedMovies,
                    currentPage: page,
                    totalPages: totalPages,
                    pagination: pagination // Pass the pagination array
                });
            })
            .catch((error) => {
                console.error("Error fetching movies:", error);
                res.render("movie/listmovie", { movies: [], currentPage: page, totalPages: 0, pagination: [] });
            });
    }
static phimmoi(page = 1) {
        const apiUrl = `https://phim.nguonc.com/api/films/phim-moi-cap-nhat?page=${page}`;
        return fetch(apiUrl)
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then((data) => {
                if (data.status === "success") {
                    return data.items || [];
                } else {
                    console.error("Error fetching data:", data.message);
                    return [];
                }
            })
            .catch((error) => {
                console.error("Network error:", error);
                return [];
            });
    }
}

module.exports = PhimmoiController;
