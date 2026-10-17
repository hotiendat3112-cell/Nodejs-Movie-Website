const PhimleController = require("./PhimleController");
const PhimboController = require("./PhimboController");
const PhimmoiController = require("./PhimmoiController");
const Movie = require("../models/Movie");
const path = require("path");
const fs = require("fs").promises;

// Khai báo sẵn headers User-Agent để tái sử dụng cho các lệnh fetch tránh lỗi 403
const fetchHeaders = {
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
};

class HomeController {
  static async banner() {
    const filePath = path.join(__dirname, "../../resources/data/banner.json");
    try {
      const data = await fs.readFile(filePath, "utf8");
      const banner = JSON.parse(data).backdrops;
      if (banner && banner.length > 0) {
        return banner[Math.floor(Math.random() * banner.length)];
      }
      return {};
    } catch (error) {
      console.error("Error fetching banner:", error.message);
      return {};
    }
  }

  static async index(req, res) {
    try {
      const [movies, odd_Movies, seri_Movies, banner_Movies] = await Promise.all([
        PhimmoiController.phimmoi().catch(() => []),
        PhimleController.phimle().catch(() => []),
        PhimboController.phimbo().catch(() => []),
        HomeController.banner().catch(() => ({})),
      ]);

      res.render("home", { 
        movies: Array.isArray(movies) ? movies : [], 
        odd_Movies: Array.isArray(odd_Movies) ? odd_Movies : [], 
        seri_Movies: Array.isArray(seri_Movies) ? seri_Movies : [], 
        banner_Movies: banner_Movies || {} 
      });
    } catch (error) {
      console.error("Error loading home page:", error.message);
      res.render("home", {
        movies: [],
        odd_Movies: [],
        seri_Movies: [],
        banner_Movies: {},
      });
    }
  }

  // Phương thức xem chi tiết phim (Hỗ trợ cả MongoDB cục bộ và API ngoài)
  static async slug(req, res) {
    const slug = req.params.slug;

    try {
      const [phimmoi, phimle, phimbo] = await Promise.all([
        PhimmoiController.phimmoi().catch(() => []),
        PhimleController.phimle().catch(() => []),
        PhimboController.phimbo().catch(() => []),
      ]);

      // 1. Kiểm tra xem slug có phải là ID của MongoDB cục bộ không (24 ký tự hex)
      if (slug.match(/^[0-9a-fA-F]{24}$/)) {
        const localMovie = await Movie.findById(slug).lean();
        if (localMovie) {
          const episodes = localMovie.episodes || [];
          const currentEpisode = episodes.length > 0 ? episodes[0] : null;

          const normalizedMovie = {
            id: localMovie._id,
            name: localMovie.title,
            title: localMovie.title,
            thumb_url: localMovie.posterUrl,
            posterUrl: localMovie.posterUrl,
            description: localMovie.description,
            category: localMovie.category,
            episodes: episodes.map(ep => ({
              episodeNumber: ep.episodeNumber,
              slug: `tap-${ep.episodeNumber}`,
              videoUrl: ep.videoUrl
            }))
          };

          return res.render("movie/details", {
            movieId: normalizedMovie.id,
            movie: normalizedMovie,
            movieNation: normalizedMovie.category,
            moviePractice: normalizedMovie.episodes,
            movieEmbed: currentEpisode ? currentEpisode.videoUrl : null,
            currentEpisode,
            isLocal: true,
            phimmoi,
            phimle,
            phimbo,
          });
        }
      }

      // 2. Nếu không phải MongoDB cục bộ, gọi API ngoài
      const apiUrl = `https://phim.nguonc.com/api/film/${slug}`;
      const response = await fetch(apiUrl, fetchHeaders);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.status === "success" && data.movie) {
        const movie = data.movie;
        const episodesList = movie.episodes && movie.episodes.length > 0 ? movie.episodes[0].items : [];
        const moviePractice = episodesList.map((item) => ({
          ...item,
          isEpisode: item.slug ? item.slug.startsWith("tap-") : false,
        }));

        res.render("movie/details", {
          movieId: movie.id,
          movie,
          movieNation: movie.category,
          moviePractice,
          movieEmbed: moviePractice.length > 0 ? moviePractice[0].embed : null,
          currentEpisode: moviePractice.length > 0 ? moviePractice[0] : null,
          isLocal: false,
          phimmoi,
          phimle,
          phimbo,
        });
      } else {
        res.render("movie/details", { movie: null, phimmoi, phimle, phimbo });
      }
    } catch (error) {
      console.error("Lỗi chi tiết phim:", error.message);
      res.render("movie/details", { movie: null, phimmoi: [], phimle: [], phimbo: [] });
    }
  }

  // Phương thức xem tập phim cụ thể
  static async tap(req, res) {
    const slug = req.params.slug;
    const tap = req.params.name;

    try {
      const [phimmoi, phimle, phimbo] = await Promise.all([
        PhimmoiController.phimmoi().catch(() => []),
        PhimleController.phimle().catch(() => []),
        PhimboController.phimbo().catch(() => []),
      ]);

      // 1. Xử lý phim cục bộ MongoDB
      if (slug.match(/^[0-9a-fA-F]{24}$/)) {
        const localMovie = await Movie.findById(slug).lean();
        if (localMovie) {
          const episodes = localMovie.episodes || [];
          const currentEpisode = episodes.find(
            ep => `tap-${ep.episodeNumber}` === tap || ep.episodeNumber.toString() === tap
          ) || episodes[0];

          const normalizedMovie = {
            id: localMovie._id,
            name: localMovie.title,
            title: localMovie.title,
            thumb_url: localMovie.posterUrl,
            posterUrl: localMovie.posterUrl,
            description: localMovie.description,
            category: localMovie.category,
            episodes: episodes.map(ep => ({
              episodeNumber: ep.episodeNumber,
              slug: `tap-${ep.episodeNumber}`,
              videoUrl: ep.videoUrl
            }))
          };

          return res.render("movie/details", {
            movieId: normalizedMovie.id,
            movie: normalizedMovie,
            movieNation: normalizedMovie.category,
            moviePractice: normalizedMovie.episodes,
            movieEmbed: currentEpisode ? currentEpisode.videoUrl : null,
            currentEpisode,
            isLocal: true,
            phimmoi,
            phimle,
            phimbo,
          });
        }
      }

      // 2. Xử lý API ngoài
      const apiUrl = `https://phim.nguonc.com/api/film/${slug}`;
      const response = await fetch(apiUrl, fetchHeaders);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      if (data.status === "success" && data.movie) {
        const movie = data.movie;
        const episodesList = movie.episodes && movie.episodes.length > 0 ? movie.episodes[0].items : [];
        const episodes = episodesList.map((item) => ({
          ...item,
          isEpisode: item.slug ? item.slug.startsWith("tap-") : false,
        }));

        const currentEpisode = episodes.find((item) => item.slug === tap) || episodes[0];

        res.render("movie/details", {
          movieId: movie.id,
          movie,
          movieNation: movie.category,
          moviePractice: episodes,
          movieEmbed: currentEpisode ? currentEpisode.embed : null,
          currentEpisode,
          isLocal: false,
          phimmoi,
          phimle,
          phimbo,
        });
      } else {
        res.render("movie/details", { movie: null, phimmoi, phimle, phimbo });
      }
    } catch (error) {
      console.error("Lỗi xem tập phim:", error.message);
      res.render("movie/details", { movie: null, phimmoi: [], phimle: [], phimbo: [] });
    }
  }

  // Phương thức Tìm kiếm kết hợp: MongoDB (Cục bộ) + API Ngoài
  static async search(req, res, next) {
    try {
      const rawKeyword = req.query.keyword || req.query.search || "";
      const trimmedQuery = rawKeyword.trim();

      if (!trimmedQuery) {
        return res.render("movie/listmovie", {
          movies: [],
          alert: "Vui lòng nhập từ khóa tìm kiếm",
        });
      }

      const mongoQuery = {
        title: { $regex: trimmedQuery,$options: "i" },
      };

      const apiKey = trimmedQuery.replace(/ /g, "+");
      const externalApiUrl = `https://phim.nguonc.com/api/films/search?keyword=${apiKey}`;

      const [localMovies, externalResult, phimmoi, phimle, phimbo] = await Promise.all([
        Movie.find(mongoQuery).lean().catch(() => []),
        
        fetch(externalApiUrl, fetchHeaders)
          .then(async (response) => {
            if (!response.ok) return { status: "error", items: [] };
            const contentType = response.headers.get("Content-Type");
            if (!contentType || !contentType.includes("application/json")) {
              return { status: "error", items: [] };
            }
            return response.json();
          })
          .catch(() => ({ status: "error", items: [] })),

        PhimmoiController.phimmoi().catch(() => []),
        PhimleController.phimle().catch(() => []),
        PhimboController.phimbo().catch(() => []),
      ]);

      const formattedLocalMovies = localMovies.map(movie => ({
        _id: movie._id,
        slug: movie._id,
        name: movie.title,
        title: movie.title,
        thumb_url: movie.posterUrl,
        posterUrl: movie.posterUrl,
        category: movie.category,
        isLocal: true
      }));

      const externalMovies = (externalResult && externalResult.status === "success" && externalResult.items)
        ? externalResult.items
        : [];

      const combinedMovies = [...formattedLocalMovies, ...externalMovies];

      res.render("movie/listmovie", {
        movies: combinedMovies,
        phimmoi,
        phimle,
        phimbo,
      });
    } catch (error) {
      console.error("Lỗi khi tìm kiếm:", error.message);
      res.render("movie/listmovie", {
        movies: [],
        alert: "Đã có lỗi xảy ra trong quá trình tìm kiếm",
      });
    }
  }

  // Phương thức xem theo thể loại
  static async theloai(req, res) {
    const slug = req.params.slug;
    const page = parseInt(req.query.page) || 1;
    const itemsPerPage = 18;
    const maxPagesToShow = 3;

    const apiUrl1 = `https://phim.nguonc.com/api/films/the-loai/${slug}?page=${page}`;
    const apiUrl2 = `https://phim.nguonc.com/api/films/the-loai/${slug}?page=${page + 1}`;

    try {
      const [res1, res2, phimmoi, phimle, phimbo] = await Promise.all([
        fetch(apiUrl1, fetchHeaders).catch(() => null),
        fetch(apiUrl2, fetchHeaders).catch(() => null),
        PhimmoiController.phimmoi().catch(() => []),
        PhimleController.phimle().catch(() => []),
        PhimboController.phimbo().catch(() => []),
      ]);

      let data1 = { items: [] };
      let data2 = { items: [] };

      if (res1 && res1.ok) {
        data1 = await res1.json().catch(() => ({ items: [] }));
      }
      if (res2 && res2.ok) {
        data2 = await res2.json().catch(() => ({ items: [] }));
      }

      const allMovies = [...(data1.items || []), ...(data2.items || [])];
      const totalPages = page + 1;
      const pagination = [];

      const startPage = Math.max(1, page - Math.floor(maxPagesToShow / 2));
      const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

      for (let i = startPage; i <= endPage; i++) {
        pagination.push(i);
      }

      res.render("movie/listmovie", {
        movies: allMovies.slice(0, itemsPerPage),
        currentPage: page,
        totalPages: totalPages,
        pagination: pagination,
        phimmoi,
        phimle,
        phimbo,
      });
    } catch (error) {
      console.error("Network error:", error.message);
      res.render("movie/listmovie", { 
        movies: [], 
        currentPage: page, 
        totalPages: 0, 
        pagination: [] 
      });
    }
  }
}

module.exports = HomeController;