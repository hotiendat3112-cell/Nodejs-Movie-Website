const itemsPerPage = 18; 
const maxPagesToShow = 3; // Set the maximum number of pages to display

// Cấu hình headers đầy đủ để giả lập trình duyệt, chống chặn 403 Forbidden từ Render
const fetchHeaders = {
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
        'Referer': 'https://phim.nguonc.com/'
    }
};

class PhimleController {
    static index(req, res) {
        const page = parseInt(req.query.page) || 1; // Default to page 1 if undefined

        Promise.all([
            PhimleController.phimle(page).catch(() => []), 
            PhimleController.phimle(page + 1).catch(() => [])
        ])
            .then(([moviesPage1, moviesPage2]) => {
                const allMovies = [...moviesPage1, ...moviesPage2];
                const displayedMovies = allMovies.slice(0, itemsPerPage); 

                const totalPages = page + 1;
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
                console.error("Error fetching movies index:", error.message);
                res.render("movie/listmovie", { movies: [], currentPage: page, totalPages: 0, pagination: [] });
            });
    }

    static phimle(page = 1) {
        const apiUrl = `https://phim.nguonc.com/api/films/the-loai/phim-le?page=${page}`;
        
        return fetch(apiUrl, fetchHeaders)
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then((data) => {
                if (data && (data.status === "success" || data.items)) {
                    return data.items || [];
                } else {
                    console.error("Error fetching data:", data?.message || "Unknown error");
                    return [];
                }
            })
            .catch((error) => {
                console.error("Network error in phimle:", error.message);
                return [];
            });
    }
}

module.exports = PhimleController;