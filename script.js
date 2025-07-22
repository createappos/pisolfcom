const wrapper = document.querySelector('.wrapper');
//search
const search_icon = document.getElementById('sicon'); // More reliable selector
const searchInput = document.getElementById('stext');
//dropbox
const dropwrapper = document.querySelector('.dropwrapper');
const dropbtn = document.querySelector('.fa-bars');

const performSearch = () => {
    const query = searchInput.value.trim();
    if (query) {
        // Redirect to the project page with the search query as a URL parameter
        window.location.href = `project.html?q=${encodeURIComponent(query)}`;
    }
};

search_icon.addEventListener('click', performSearch);

searchInput.addEventListener('keyup', (e) => {
    // Perform search when the 'Enter' key is pressed
    if (e.code === 'Enter') {
        performSearch();
    }
});

dropbtn.addEventListener('click',()=>{
    dropwrapper.classList.toggle('actived');
    dropbtn.classList.toggle('actived');
})