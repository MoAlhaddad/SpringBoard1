class User    // Data & methods of a user profile
{
    constructor(name, username, joinDate, token)
    {
        this.name = name;
        this.username = username;
        this.joinDate = new Date(joinDate);
        this.token = token;
    }
}

class ArticleList    // Data & methods of all the articles (this is designed so that there are no duplicate articles across all arrays)
{
    constructor()
    {
        this.all = [];    // All articles listed in the main content
        this.users = [];    // All articles that the user has posted
        this.favorites = [];    // All articles that the user has favorited
        this.random = null;    // The random article currently being displayed
        this.max = 200;    // The max index to guess for picking a random article
    }


    async getAllArticles(interval)    // This gets all articles in intervals and pushes it into [this.all]
    {
        let count = 0;    // The count is to keep track of how large the array could be
        this.all = [];    // If the array length is equal to count, then there are more articles to get

        while (this.all.length == count)
        {
            const articles = await api.getArticles(count, interval);
            count += interval;

            for (let i = 0; i < articles.length; i++)
            {
                let article = this.findArticle(articles[i].storyId);
                if (article == null)
                    article = new Article(articles[i].url, articles[i].title, articles[i].author, articles[i].username, articles[i].storyId);

                this.all.push(article);
            }
        }
    }


    setCustomArticles(userData)    // Inserts all user articles (their posts and favorites) into [this.users] and [this.favorites]
    {
        this.clearCustomArticles();
        userData.stories.forEach(article => articles.newUserArticle(article));
        userData.favorites.forEach(article => articles.newFavoriteArticle(article));
    }

    clearCustomArticles()    // Clears the 2 arrays that belong to the user
    {
        this.users = [];
        this.favorites = [];
    }


    newUserArticle(newArticle)    // Finds or creates a new article and sets as the user's post
    {
        let article = this.findArticle(newArticle.storyId);
        if (article == null)
            article = new Article(newArticle.url, newArticle.title, newArticle.author, newArticle.username, newArticle.storyId);

        this.setUserArticle(article);
        return article;
    }

    setUserArticle(article)    // Marks the article as the user's post, setting the button and inserting the article into [this.users]
    {
        article.editable = true;
        article.setButtons();

        this.users.unshift(article);
    }

    delUserArticle(article)    // Deletes an article completely (since a user article being deleted removes the article completely)
    {
        article.trimHtml();
        article.html.forEach(html => html.$container.remove());

        let index = this.all.indexOf(article);
        if (index != -1)
            this.all.splice(index, 1);

        index = this.users.indexOf(article);
        if (index != -1)
            this.users.splice(index, 1);

        index = this.favorites.indexOf(article);
        if (index != -1)
            this.favorites.splice(index, 1);
    }


    async updateFavoriteArticle(user, article, favorited)    // Wrapper to mark an article as favorite or not
    {
        if (favorited)
        {
            this.setFavoriteArticle(article);

            const response = await api.addFavorite(user.username, article.id, user.token);
            if (response != "200")
                this.delFavoriteArticle(article);
        }
        else
        {
            this.delFavoriteArticle(article);

            const response = await api.delFavorite(user.username, article.id, user.token);
            if (response != "200")
                this.setFavoriteArticle(article);

        }
    }

    newFavoriteArticle(newArticle)    // Finds or creates a new article and sets as the users's favorite
    {
        let article = this.findArticle(newArticle.storyId);
        if (article == null)
            article = new Article(newArticle.url, newArticle.title, newArticle.author, newArticle.username, newArticle.storyId);

        this.setFavoriteArticle(article);
        return article;
    }

    setFavoriteArticle(article)    // Marks the article as the user's favorite, setting the button and inserting the article into [this.favorites]
    {
        article.favorited = true;
        article.setButtons();

        this.favorites.unshift(article);
    }

    delFavoriteArticle(article)    // Removes article from [this.favorites] and resets the button
    {
        article.favorited = false;
        article.setButtons();

        const index = this.favorites.indexOf(article);
        if (index != -1)
            this.favorites.splice(index, 1);
    }


    findArticle(id)    // Searches for article by id in all arrays : [this.all] > [this.users] > [this.favorites] > [this.random]
    {
        let article;

        article = this.all.find(a => a.id == id);
        if (article != null)
            return article;

        article = this.users.find(a => a.id == id);
        if (article != null)
            return article;

        article = this.favorites.find(a => a.id == id);
        if (article != null)
            return article;

        if (this.random != null && this.random.id == id)
            return this.random;

        return null;
    }


    async newRandomArticle()    // Sets a new random article to [this.random]
    {
        //#region Explanation
        /*/
        I didn't want to just grab a random article thats already displayed on the screen via the arrays
        So instead, this will grab a random article from the entire api database via random index (from 0 to max)
        The max index it can search decreases on every failure so it won't search constantly - Shown in [api.getRandomArticle]
        Then it saves the max to [this.max] so that it can remember to not search over the max again
        //*/
        //#endregion

        const response = await api.getRandomArticle(this.max);

        this.max = response.max;
        const newArticle = response.article;

        if (this.random != null && this.random.id == newArticle.storyId)
            return this.newRandomArticle();

        let article = this.findArticle(newArticle.storyId);
        if (article == null)
            article = new Article(newArticle.url, newArticle.title, newArticle.author, newArticle.username, newArticle.storyId);

        this.random = article;
        return article;
    }
}

class Article    // Data & methods of an article/post/story
{
    constructor(url, title, author, poster, id)
    {
        this.url = url;
        this.title = title;
        this.author = author;
        this.poster = poster;
        this.id = id;

        this.favorited = false;
        this.editable = false;

        this.html = [];    // Array of html bars/cards of the article
    }


    update(url, title, author)    // Changes the article info
    {
        this.url = url;
        this.title = title;
        this.author = author;
    }


    setFavorite(favorited)
    {
        this.favorited = favorited;
        this.setButtons();
    }

    setEditable(editable)
    {
        this.editable = editable;
        this.setButtons();
    }


    newHtml(type)    // Creates a new html bar/card, pushes to array, and returns the $container
    {
        const html = new ArticleHtml(this, type);
        this.html.push(html);
        return html;
    }

    trimHtml()    // Delete any nodes from [this.html] that does not exist in the dom
    {
        const newHtml = [];

        for (let i = 0; i < this.html.length; i++)
            if ($(document.body).has(this.html[i].$container).length != 0)
                newHtml.push(this.html[i]);

        this.html = newHtml;
    }


    // Methods to control all html belonging to the article
    setButtons = () => this.html.forEach(html => html.setButtons(this.favorited, this.editable));
    disableButtons = () => this.html.forEach(html => html.disableButtons());
}

class ArticleHtml    // HTML data & construction of an article's html
{
    constructor(article, type)
    {
        this.$container = ArticleHtml.constructHtml(article, type);
        this.type = type;

        const buttons = this.$container.find(".postInfo_button");
        this.$favButton = buttons.eq(0);
        this.$editButton = buttons.eq(1);

        ArticleHtml.initializeShadowHover(this.$container);
    }


    static constructHtml(article, type)    // Constructs and returns the html $element
    {
        //#region Template HTML Bar
        /*/
        <div class="container shadow-sm">
            <div class="row postTitle" onclick="window.open('https://www.alonglinkbutnotreally.com/someArticleCategory/ArticleTitle', '_blank')">
                <div class="col postTitle_name">A really rediculously long article name where the title will not fit on this box because of the sheer amount of words in this really long title</div>
                <button class="col col-auto btn btn-sm btn-link postTitle_link" type="button" data-toggle="tooltip" data-placement="top" title="https://www.alonglinkbutnotreally.com/someArticleCategory/ArticleTitle">alonglinkbutnotreally.com</button>
            </div>
            <div class="row postInfo">
                <div class="col col-1 postInfo_fav"><button type="button" class="btn btn-sm btn-outline-warning postInfo_button" disabled><i class="fas fa-star"></i> Favorite</button></div>
                <div class="col col-1 postInfo_label">Author :</div>
                <div class="col col-4 postInfo_author">A Guy With A Name, like a really long name, a rediculously humungous name where it wouldn't fit on the alloted space</div>
                <div class="col col-1 postInfo_label">Poster :</div>
                <div class="col col-4 postInfo_poster">Another Guy, whose name is not as long as the first guy, but still pretty long</div>
                <div class="col col-1 postInfo_edit"><button type="button" class="btn btn-sm btn-light postInfo_button d-none" style="margin: 0px; float: right;"><i class="fas fa-edit"></i> Edit</button></div>
            </div>
        </div>
        <div class="spacing"></div>
        //*/
        //#endregion

        //#region Template HTML Card
        /*/
        <div class="container shadow-sm">
            <div class="row shadow-sm panel_postTitle onclick="window.open('https://www.alonglinkbutnotreally.com/someArticleCategory/ArticleTitle', '_blank')"><center>Article with a decently long name that overflows into the second line and contines on and on and on to whichever line it feels like</center></div>
            <div class="row shadow-sm panel_postLink_Wrapper onclick="window.open('https://www.alonglinkbutnotreally.com/someArticleCategory/ArticleTitle', '_blank')"><button class="col col-auto btn btn-sm btn-link panel_postLink" type="button" data-toggle="tooltip" data-placement="left" title="https://www.alonglinkbutnotreally.com/someArticleCategory/ArticleTitle">alonglinkbutnotreally.com</button></div>
            <div class="row panel">
                <div class="col col-3 panel_label">
                    Author :<br />
                    Poster :<br />
                </div>
                <div class="col panel_info">
                    A Guy With A Name, like a really long name, a rediculously humungous name where it wouldn't fit on the alloted space<br />
                    Another Guy, whose name is not as long as the first guy, but still pretty long<br />
                </div>
            </div>
            <div class="row shadow-sm panel_postFooter">
                <div class="col postInfo_fav"><button type="button" class="btn btn-sm btn-outline-warning postInfo_button" disabled style="margin: 0px; float: left;"><i class="fas fa-star"></i> Favorite</button></div>
                <div class="col postInfo_edit"><button type="button" class="btn btn-sm btn-light postInfo_button d-none" style="margin: 0px; float: right;"><i class="fas fa-edit"></i> Edit</button></div>
            </div>
        </div>
        <div class="spacing"></div>
        //*/
        //#endregion

        let htmlString;
        switch (type)
        {
            case "bar":
                htmlString = `<div class="container shadow-sm"> <div class="row postTitle" onclick="window.open('${article.url}', '_blank')"> <div class="col postTitle_name">${article.title}</div> <button class="col col-auto btn btn-sm btn-link postTitle_link" type="button" data-toggle="tooltip" data-placement="top" title="${article.url}">${ArticleHtml.getHostName(article.url)}</button> </div> <div class="row postInfo"> <div class="col col-1 postInfo_fav"><button type="button" class="btn btn-sm btn-outline-warning postInfo_button" disabled><i class="fas fa-star"></i> Favorite</button></div> <div class="col col-1 postInfo_label">Author :</div> <div class="col col-4 postInfo_author">${article.author}</div> <div class="col col-1 postInfo_label">Poster :</div> <div class="col col-4 postInfo_poster">${article.poster}</div> <div class="col col-1 postInfo_edit"><button type="button" class="btn btn-sm btn-light postInfo_button d-none" style="margin: 0px; float: right;"><i class="fas fa-edit"></i> Edit</button></div> </div> </div> <div class="spacing"></div>`
                break;

            case "card":
                htmlString = `<div class="container shadow-sm"> <div class="row shadow-sm panel_postTitle" onclick="window.open('${article.url}', '_blank')"><center>${article.title}</center></div> <div class="row shadow-sm panel_postLink_Wrapper" onclick="window.open('${article.url}', '_blank')"><button class="col col-auto btn btn-sm btn-link panel_postLink" type="button" data-toggle="tooltip" data-placement="left" title="${article.url}">${ArticleHtml.getHostName(article.url)}</button></div> <div class="row panel"> <div class="col col-3 panel_label"> Author :<br /> Poster :<br /> </div> <div class="col panel_info"> ${article.author}<br /> ${article.poster}<br /> </div> </div> <div class="row shadow-sm panel_postFooter"> <div class="col postInfo_fav"><button type="button" class="btn btn-sm btn-outline-warning postInfo_button" disabled style="margin: 0px; float: left;"><i class="fas fa-star"></i> Favorite</button></div> <div class="col postInfo_edit"><button type="button" class="btn btn-sm btn-light postInfo_button d-none" style="margin: 0px; float: right;"><i class="fas fa-edit"></i> Edit</button></div> </div> </div> <div class="spacing"></div>`;
                break;

            default:
                console.log("Incorrect Article Html Type");
                return null;
        }

        return $($.parseHTML(htmlString));
    }
    static getHostName(url)    // Shortens url to domain only
    {
        let hostName;

        if (url.indexOf("://") > -1)
        {
            hostName = url.split("/")[2];
        }
        else
        {
            hostName = url.split("/")[0];
        }

        if (hostName.slice(0, 4) === "www.")
        {
            hostName = hostName.slice(4);
        }

        return hostName;
    }

    static initializeShadowHover($container)    // Adds a hover event that enlargens the shadow
    {
        $container.hover(
            function () { $container.eq(0).addClass("shadow") },
            function () { $container.eq(0).removeClass("shadow") });
    } 


    initializeButtons(favFunction, editFunction)    // Sets up the article buttons with functions
    {
        this.$favButton.click(favFunction);
        this.$editButton.click(editFunction);
    }

    setButtons(favorited, editable)    // Enables and sets button to certain states
    {
        this.$favButton.prop("disabled", false);
        this.$favButton.toggleClass("active", favorited);
        this.$editButton.toggleClass("d-none", !editable);
    }

    disableButtons()    // Fully disable buttons
    {
        this.$favButton.prop("disabled", true);
        this.$editButton.toggleClass("d-none", true);
    }
}

class NavBar    // Html data & methods for the top navbar
{
    constructor($container, functions)
    {
        this.$container = $container;
        this.$title = $container.find("b");
        this.$items = $container.find(".menu_item");

        this.$items.each(function (i)    // Adds hover and click events for each item in the navbar
        {
            const $item = $(this);
            NavBar.initializeHover($item);
            NavBar.initializeClick($item, functions[i]);
        });
    }


    titleText = (text) => this.$title.text(text);    // Changes the title text of the navbar


    static initializeHover($item)    // Sets up hover event
    {
        $item.hover(
            function () { $item.addClass("shadow-sm bg-white"); },
            function () { $item.removeClass("shadow-sm bg-white"); });
    }

    static initializeClick = ($item, clickFunction) => $item.click(clickFunction);    // Adds a click event to the menu item
}

class MainContent
{
    constructor($container)
    {
        this.$container = $container;
        this.$articles = $container.find("#articles");
        this.$loadingIcon = $container.find(".spinner-border");
    }


    loading = (loading) => this.$loadingIcon.toggleClass("d-none", !loading);    // Shows/hides a loading spinner


    showArticles = (visability) => this.$articles.toggleClass("d-none", !visability);
    prependArticle = (articleHtml) => this.$articles.prepend(articleHtml.$container);
    appendArticle = (articleHtml) => this.$articles.append(articleHtml.$container);
    clearArticles = () => this.$articles.html("");

    hideAll = () => this.$container.children().each(function () { $(this).addClass("d-none") });
}

class Page    // Html data & methods of a page on the main content
{
    constructor($container)
    {
        this.$container = $container;
        this.$content = $container.find(".page_content").children().eq(1);
        this.$auxButton = $container.find("button");
        this.$errorMessage = $container.find(".page_errorMessage");
    }


    // Wrapper methods to manipulate pages
    show = (visability) => this.$container.toggleClass("d-none", !visability);

    enableForm = (enabled) => this.$content.find("input, .btn").prop("disabled", !enabled)
    clearForm = () => this.$content.find("input:not(.btn)").val("");

    errorMessage = (message) => this.$errorMessage.text(message);


    // Add events to page interactables
    initializeForm(submitFunction)
    {
        this.$content.submit(function (event)
        {
            event.preventDefault();
            submitFunction();
        });
    }

    initializeButton(auxFunction)
    {
        this.$auxButton.click(auxFunction);
    }
}

class Panel    // Html data & methods of a panel on the right sidebar
{
    constructor($container)
    {
        this.$container = $container;
        this.$titleText = $container.find(".panel_title");
        this.$loadingIcon = $container.find(".spinner-grow");
        this.$colLeft = $container.find(".panel_content").children().eq(0);
        this.$colRight = $container.find(".panel_content").children().eq(1);
        this.$errorMessage = $container.find(".panel_errorMessage");
        this.$articles = $container.find("#articles");
        this.$buttonLeft = this.$container.find(".panel_button").eq(0);
        this.$buttonRight = this.$container.find(".panel_button").eq(1);
    }


    // Wrapper methods to manipulate panels
    show = (visability) => this.$container.toggleClass("d-none", !visability);

    setTitle = (text) => this.$titleText.text(text);
    loading = (loading) => this.$loadingIcon.toggleClass("d-none", !loading);

    setColLeft = (html) => this.$colLeft.html(html);
    setColRight = (html) => this.$colRight.html(html);

    enableForm = (enabled) => this.$colRight.find("input").prop("disabled", !enabled)
    clearForm = () => this.$colRight.find("input").val("");

    errorMessage = (message) => this.$errorMessage.text(message);

    enableButtons(left, right)
    {
        this.$buttonLeft.prop("disabled", !left);
        this.$buttonRight.prop("disabled", !right);
    }
    setButtonText(left, right)
    {
        this.$buttonLeft.text(left);
        this.$buttonRight.text(right);
    }


    appendArticle = (articleHtml) => this.$articles.append(articleHtml.$container);
    clearArticles = () => this.$articles.html("");


    // Add events to panel interactables
    initializeForm(submitFunction)
    {
        this.$colRight.submit(function (event)
        {
            event.preventDefault();
            submitFunction();
        });
    }

    initializeButtons(leftFunction, rightFunction)
    {
        this.$buttonLeft.click(leftFunction);
        this.$buttonRight.click(rightFunction);
    }
}