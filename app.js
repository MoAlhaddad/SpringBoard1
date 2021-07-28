$('body').tooltip({ selector: '[data-toggle="tooltip"]' });     // Bootstrap Tooltip Activation

$(function ()
{
    initializePage_submitArticle();
    initializePage_editArticle();
    initializePage_login();
    initializePage_createAccount();
    initializePage_editAccount();
    initializePage_userProfile();

    initializePanel_userProfile();
    initializePanel_submitArticle();
    initializePanel_userArticles();
    initializePanel_randomArticle();

    checkExistingUser();
    listAllArticles();
})

//#region Variables
const navBar = new NavBar($("#navBar"), [listAllArticles, listUserArticles, listFavoriteArticles, showPage_submitArticle, function () { (user == null) ? showPage_login() : showPage_userProfile() }]);
const mainContent = new MainContent($("#mainContent"));

const page_submitArticle = new Page($("#page_submitArticle"));
const page_editArticle = new Page($("#page_editArticle"));
const page_login = new Page($("#page_login"));
const page_createAccount = new Page($("#page_createAccount"));
const page_editAccount = new Page($("#page_editAccount"));
const page_userProfile = new Page($("#page_userProfile"));

const panel_userProfile = new Panel($("#panel_userProfile"));
const panel_submitArticle = new Panel($("#panel_submitArticle"));
const panel_userArticles = new Panel($("#panel_userArticles"));
const panel_randomArticle = new Panel($("#panel_randomArticle"));

let user = null;
const articles = new ArticleList();

let currentContent = "all";
let loadingArticles = false;
let listInterval = null;
let listCount = 0;
//#endregion


//#region Article List
async function getArticles()    // Gets all the articles and then finish filling the main page with articles (unless the main page was changed)
{
    loadingArticles = true;
    mainContent.loading(true);

    await articles.getAllArticles(25);

    loadingArticles = false;
    mainContent.loading(false);

    if (navBar.$title.text() != "All Articles")
        return;

    clearInterval(listInterval);
    appendArticles(articles.all, listCount);
}


function appendArticles(array, skip)
{
    for (let i = skip; i < array.length; i++)
    {
        const article = array[i];
        const articleHtml = article.newHtml("bar");

        mainContent.appendArticle(articleHtml);
        articleHtml.initializeButtons(toggleFavorite(article), toggleEdit(article));
        updateArticleButtons(article);
        article.trimHtml();
    }

    listCount = array.length;
}


function listAllArticles()    // Starts getting all articles (unless already doing so) and sets an interval to list the articles as more articles are retrieved
{
    navBar.titleText("All Articles");
    mainContent.hideAll();
    mainContent.clearArticles();
    mainContent.showArticles(true);

    if (!loadingArticles)
        getArticles();

    listCount = 0;
    clearInterval(listInterval);
    listInterval = setInterval(function () { appendArticles(articles.all, listCount) }, 100);
}

function listUserArticles()
{
    if (user == null)
        return;

    navBar.titleText("Your Articles");
    mainContent.hideAll();
    mainContent.clearArticles();
    mainContent.showArticles(true);

    clearInterval(listInterval);


    appendArticles(articles.users, 0);
}

function listFavoriteArticles()
{
    if (user == null)
        return;

    navBar.titleText("Favorite Articles");
    mainContent.hideAll();
    mainContent.clearArticles();
    mainContent.showArticles(true);

    clearInterval(listInterval);


    appendArticles(articles.favorites, 0);
}
//#endregion

//#region Article
async function submitArticle(url, title, author)    // Marks the page and panel for article submission and handles the submission itself
{
    if (user == null)
        return;

    page_attemptSubmitArticle();
    panel_attemptSubmitArticle();

    const response = await api.createArticle(url, title, author, user.username, user.token);

    page_showSubmitForm();
    panel_showSubmitForm();

    if (response == "400")
    {
        page_submitArticle.errorMessage("Invalid article info");
        panel_submitArticle.errorMessage("Invalid article info");
    }
    else
    {
        const article = articles.newUserArticle(response);

        panel_listUserArticles(3);

        if (navBar.$title.text() == "All Articles" || navBar.$title.text() == "Your Articles")
        {
            const articleHtml = article.newHtml("bar");

            mainContent.prependArticle(articleHtml);
            articleHtml.initializeButtons(toggleFavorite(article), toggleEdit(article));
            updateArticleButtons(article);
        }
    }
}

async function editArticle(article, url, title, author)    // Marks the page for article editing and handles the edit
{
    if (user == null)
        return;

    page_attemptEditArticle();

    const response = await api.editArticle(article.id, url, title, author, user.username, user.token);

    if (response == "200")
    {
        article.update(url, title, author);

        panel_listUserArticles(3);
    }
    else if (response == "403")
        page_editArticle.errorMessage("Article cannot be edited");
    else if (response == "404")
        page_editArticle.errorMessage("Article does not exist");
    else
        page_editArticle.errorMessage("Article edit failed");

    page_showEditArticleForm(article);
}

async function deleteArticle(article)    // Deletes the article
{
    if (user == null)
        return;

    const response = await api.deleteArticle(article.id, user.token);

    if (response == "200")
    {
        articles.delUserArticle(article);

        panel_listUserArticles(3);

        return listUserArticles();
    }
    else
        page_editArticle.errorMessage("Article failed to delete");

    page_showEditArticleForm(article);
}


updateArticleButtons = (article) => (user == null) ? article.disableButtons() : article.setButtons();

toggleFavorite = (article) => function () { articles.updateFavoriteArticle(user, article, !article.favorited); };

toggleEdit = (article) => function () { showPage_editArticle(article); };
//#endregion

//#region User Profile
async function login(username, password)    // Marks the page for logging in and handles the login
{
    if (user != null)
        return;

    page_attemptLogin();
    panel_attemptLogin();

    const response = await api.login(username, password);

    page_showLoginForm();
    panel_showLoginForm();

    if (response == "404")
    {
        page_login.errorMessage("User does not exist");
        panel_userProfile.errorMessage("User does not exist");
    }
    else if (response == "401")
    {
        page_login.errorMessage("Incorrect password");
        panel_userProfile.errorMessage("Incorrect password");
    }
    else if (response == "400")
    {
        page_login.errorMessage("Internal error");
        panel_userProfile.errorMessage("Internal error");
    }
    else
        return newUser(response);
}


async function getAccount(username, token)    // Gets an existing logged in user
{
    if (user != null)
        return;

    const response = await api.getAccount(username, token);

    if (response == "401")
        console.log("Authentication failure");
    else if (response == "404")
        console.log("Account not found");
    else
        newUser({ user: response, token });
}

async function createAccount(name, username, password)    // Marks page for account creation and handles account creation
{
    if (user != null)
        return;

    page_attemptCreateAccount();

    const response = await api.createAccount(name, username, password);

    page_showCreateAccountForm();

    if (response == "409")
        page_createAccount.errorMessage("Username already exists");
    else
        return newUser(response);
}

async function editAccount(username, oldPassword, name, newPassword)    // Marks page for account editing and handles the edit
{
    if (user == null)
        return;

    page_attemptEditAccount();

    let response = await api.login(username, oldPassword);

    if (response == "404")
    {
        page_editAccount.errorMessage("Account does not exist");
        return page_showEditAccountForm();
    }
    else if (response == "401")
    {
        page_editAccount.errorMessage("Incorrect password");
        return page_showEditAccountForm();
    }
    else if (response == "400")
    {
        page_editAccount.errorMessage("Internal Error");
        return page_showEditAccountForm();
    }

    user.token = response.token;
    response = await api.editAccount(name, newPassword, user.username, user.token);

    page_showEditAccountForm();

    if (response == "401")
        page_editAccount.errorMessage("Authentication failure");
    else if (response == "403")
        page_editAccount.errorMessage("Account cannot be edited");
    else if (response == "404")
        page_editAccount.errorMessage("Account does not exist");
    else if (response == "400")
        page_editAccount.errorMessage("Internal Error");
    else
        newUser({ user: response, token: user.token });
}

async function deleteAccount()    // Deletes the currently signed in account
{
    const response = await api.deleteAccount(user.username, user.token);

    if (response == "200")
        logout();
    else
        page_editAccount.errorMessage("Account deletion failed");

}


function logout()    // Log the user out and set the page accordingly, does not refresh
{
    user = null;
    localStorage.clear();

    articles.all.forEach(article => updateArticleButtons(article));
    articles.clearCustomArticles();

    if (navBar.$title.text() == "Edit Account" || navBar.$title.text() == "User Profile")
        showPage_login();
    else if (navBar.$title.text() != "All Articles")
        listAllArticles();

    panel_showLoginForm();
    panel_submitArticle.show(false);
    panel_userArticles.show(false);
    panel_listUserArticles(0);
}

function newUser(data)    // Creates a [user] and sets the page according to the new user data
{
    user = new User(data.user.name, data.user.username, data.user.createdAt, data.token);
    localStorage.setItem("username", user.username);
    localStorage.setItem("token", user.token);

    articles.all.forEach(article => updateArticleButtons(article));
    articles.setCustomArticles(data.user);
    if (articles.random != null)
        updateArticleButtons(articles.random);

    if (navBar.$title.text() == "Log In" || navBar.$title.text() == "Create Account")
        listAllArticles();

    panel_showProfile();
    panel_submitArticle.show(true);
    panel_userArticles.show(true);
    panel_listUserArticles(3);
}

function checkExistingUser()
{
    const username = localStorage.getItem("username");
    const token = localStorage.getItem("token");

    if (!username || !token)
        return;

    getAccount(username, token);
}
//#endregion


//#region Page : Submit Article
function initializePage_submitArticle()
{
    page_submitArticle.initializeForm(page_submitUserArticle);
}

function showPage_submitArticle()
{
    if (user == null)
        return;

    navBar.titleText("Submit Article");
    mainContent.hideAll();
    page_submitArticle.show(true);
    page_submitArticle.errorMessage("");
}


function page_submitUserArticle()
{
    const url = page_submitArticle.$content.find("#url").val();
    const title = page_submitArticle.$content.find("#title").val();
    const author = page_submitArticle.$content.find("#author").val();

    if (url == "" || title == "" || author == "")
    {
        page_submitArticle.errorMessage("Article info cannot be empty");
        return;
    }

    submitArticle(url, title, author);
}


function page_attemptSubmitArticle()
{
    mainContent.loading(true);
    page_submitArticle.enableForm(false);
    page_submitArticle.errorMessage("");
}

function page_showSubmitForm()
{
    mainContent.loading(false);
    page_submitArticle.enableForm(true);
    page_submitArticle.clearForm();
}
//#endregion

//#region Page : Edit Article
function initializePage_editArticle()
{
    page_editArticle.initializeForm(page_editUserArticle);
    page_editArticle.initializeButton(page_deleteUserArticle);
}

function showPage_editArticle(article)
{
    if (user == null)
        return;

    navBar.titleText("Edit Article");
    mainContent.hideAll();
    page_editArticle.show(true);
    page_editArticle.errorMessage("");

    page_editArticle.$content.find("#id").val(article.id);
    page_editArticle.$content.find("#url").val(article.url);
    page_editArticle.$content.find("#title").val(article.title);
    page_editArticle.$content.find("#author").val(article.author);
}


function page_editUserArticle()
{
    const id = page_editArticle.$content.find("#id").val();
    const url = page_editArticle.$content.find("#url").val();
    const title = page_editArticle.$content.find("#title").val();
    const author = page_editArticle.$content.find("#author").val();

    if (url == "" || title == "" || author == "")
    {
        page_editArticle.errorMessage("Article info cannot be empty");
        return;
    }

    const article = articles.findArticle(id);

    if (url == article.url && title == article.title && author == article.author)
    {
        page_editArticle.errorMessage("Article info cannot be the same");
        return;
    }

    editArticle(article, url, title, author);
}

function page_deleteUserArticle()
{
    const id = page_editArticle.$content.find("#id").val();
    const article = articles.findArticle(id);

    deleteArticle(article);
}


function page_attemptEditArticle()
{
    mainContent.loading(true);
    page_editArticle.enableForm(false);
    page_editArticle.errorMessage("");
}

function page_showEditArticleForm(article)
{
    mainContent.loading(false);
    page_editArticle.enableForm(true);
    page_editArticle.clearForm();

    page_editArticle.$content.find("#id").val(article.id);
    page_editArticle.$content.find("#url").val(article.url);
    page_editArticle.$content.find("#title").val(article.title);
    page_editArticle.$content.find("#author").val(article.author);
}
//#endregion

//#region Page : Log In
function initializePage_login()
{
    page_login.initializeForm(page_userLogin);
    page_login.initializeButton(showPage_createAccount);
}

function showPage_login()
{
    if (user != null)
        return;

    navBar.titleText("Log In");
    mainContent.hideAll();
    page_login.show(true);
    page_login.errorMessage("");
}


function page_userLogin()
{
    const username = page_login.$content.find("#username").val();
    const password = page_login.$content.find("#password").val();

    if (username == "" || password == "")
    {
        page_login.errorMessage("Credentials cannot be empty");
        return;
    }

    login(username, password);
}


function page_attemptLogin()
{
    mainContent.loading(true);
    page_login.enableForm(false);
    page_login.errorMessage("");
}

function page_showLoginForm()
{
    mainContent.loading(false);
    page_login.enableForm(true);
    page_login.clearForm();
}
//#endregion

//#region Page : Create Account
function initializePage_createAccount()
{
    page_createAccount.initializeForm(page_createUserAccount);
}

function showPage_createAccount()
{
    if (user != null)
        return;

    navBar.titleText("Create Account");
    mainContent.hideAll();
    page_createAccount.show(true);
    page_createAccount.errorMessage("");
}


function page_createUserAccount()
{
    const name = page_createAccount.$content.find("#name").val();
    const username = page_createAccount.$content.find("#username").val();
    const password = page_createAccount.$content.find("#password").val();

    if (name == "" || username == "" || password == "")
    {
        page_createAccount.errorMessage("Credentials cannot be empty");
        return;
    }

    createAccount(name, username, password);
}


function page_attemptCreateAccount()
{
    mainContent.loading(true);
    page_createAccount.enableForm(false);
    page_createAccount.errorMessage("");
}

function page_showCreateAccountForm()
{
    mainContent.loading(false);
    page_createAccount.enableForm(true);
    page_createAccount.clearForm();
}
//#endregion

//#region Page : Edit Account
function initializePage_editAccount()
{
    page_editAccount.initializeForm(page_editUserAccount);
    page_editAccount.initializeButton(deleteAccount);
}

function showPage_editAccount()
{
    if (user == null)
        return;

    navBar.titleText("Edit Account");
    mainContent.hideAll();
    page_editAccount.show(true);
    page_editAccount.errorMessage("");

    page_editAccount.$content.find("#name").val(user.name);
    page_editAccount.$content.find("#username").val(user.username);
}


function page_editUserAccount()
{
    const username = page_editAccount.$content.find("#username").val();
    const name = page_editAccount.$content.find("#name").val();
    const oldPassword = page_editAccount.$content.find("#oldPassword").val();
    let newPassword = page_editAccount.$content.find("#newPassword").val();

    if (username == "" || name == "" || oldPassword == "")
    {
        page_editAccount.errorMessage("Credentials cannot be empty");
        return;
    }

    if (newPassword == "")
    {
        if (name == user.name)
        {
            page_editAccount.errorMessage("Account info cannot be the same");
            return;
        }

        newPassword = oldPassword;
    }

    editAccount(username, oldPassword, name, newPassword);
}


function page_attemptEditAccount()
{
    mainContent.loading(true);
    page_editAccount.enableForm(false);
    page_editAccount.errorMessage("");
}

function page_showEditAccountForm()
{
    mainContent.loading(false);
    page_editAccount.enableForm(true);
    page_editAccount.clearForm();

    page_editAccount.$content.find("#name").val(user.name);
    page_editAccount.$content.find("#username").val(user.username);
}
//#endregion

//#region Page : User Profile
function initializePage_userProfile()
{
    page_userProfile.$auxButton.eq(0).click(logout);
    page_userProfile.$auxButton.eq(1).click(showPage_editAccount);
}

function showPage_userProfile()
{
    if (user == null)
        return;

    navBar.titleText("User Profile");
    mainContent.hideAll();
    page_userProfile.show(true);
    page_userProfile.errorMessage("");

    page_userProfile.$content.children().eq(0).text(user.username);
    page_userProfile.$content.children().eq(2).text(user.name);
    page_userProfile.$content.children().eq(4).text(user.joinDate.toDateString());
    page_userProfile.$content.children().eq(6).text(articles.users.length + " Articles");
    page_userProfile.$content.children().eq(8).text(articles.favorites.length + " Articles");
}
//#endregion


//#region Panel : User Profile
function initializePanel_userProfile()
{
    panel_userProfile.show(true);
    panel_userProfile.initializeForm(panel_userLogin);
    panel_userProfile.initializeButtons(function () { (user == null) ? showPage_createAccount() : showPage_editAccount() }, function () { (user == null) ? panel_userLogin() : logout() });
}


function panel_userLogin()
{
    const username = panel_userProfile.$colRight.find("#username").val();
    const password = panel_userProfile.$colRight.find("#password").val();

    if (username == "" || password == "")
    {
        panel_userProfile.errorMessage("Credentials cannot be empty");
        return;
    }

    login(username, password);
}


function panel_attemptLogin()
{
    panel_userProfile.setTitle("Logging in");
    panel_userProfile.loading(true);
    panel_userProfile.enableForm(false);
    panel_userProfile.errorMessage("");
    panel_userProfile.enableButtons(true, false);
}

function panel_showLoginForm()
{
    panel_userProfile.setTitle("Log In");
    panel_userProfile.loading(false);
    panel_userProfile.enableForm(true);
    panel_userProfile.enableButtons(true, true);

    panel_userProfile.$colLeft.html("Username :<br />Password :<br />");
    panel_userProfile.$colRight.html(`<form><input type = "text" class= "form-control panel_input" id="username" placeholder = "Enter your username" /><input type="password" class="form-control panel_input" id="password" placeholder="Enter your password" /><input type="submit" style="display: none"></form>`);

    panel_userProfile.$colRight.removeClass("panel_info");
    panel_userProfile.$colRight.addClass("panel_form");

    panel_userProfile.setButtonText("Create Account", "Log In");
}

function panel_showProfile()
{
    panel_userProfile.setTitle("User Profile");
    panel_userProfile.loading(false);
    panel_userProfile.errorMessage("");
    panel_userProfile.enableButtons(true, true);

    panel_userProfile.$colLeft.html("Name :<br />Username :<br />Date Joined :<br />");
    panel_userProfile.$colRight.html(`${user.name}<br />${user.username}<br />${user.joinDate.toDateString()}<br />`);

    panel_userProfile.$colRight.removeClass("panel_form");
    panel_userProfile.$colRight.addClass("panel_info");

    panel_userProfile.setButtonText("Edit Account", "Log Out");
}
//#endregion

//#region Panel : Submit Article
function initializePanel_submitArticle()
{
    panel_submitArticle.initializeForm(panel_submit);
    panel_submitArticle.initializeButtons(showPage_submitArticle, panel_submit);
}


function panel_submit()
{
    const url = panel_submitArticle.$colRight.find("#url").val();
    const title = panel_submitArticle.$colRight.find("#title").val();
    const author = panel_submitArticle.$colRight.find("#author").val();

    if (url == "" || title == "" || author == "")
    {
        panel_submitArticle.errorMessage("Article info cannot be empty");
        return;
    }

    submitArticle(url, title, author);
}


function panel_attemptSubmitArticle()
{
    panel_submitArticle.setTitle("Submitting");
    panel_submitArticle.loading(true);
    panel_submitArticle.enableForm(false);
    panel_submitArticle.errorMessage("");
    panel_submitArticle.enableButtons(true, false);
}

function panel_showSubmitForm()
{
    panel_submitArticle.setTitle("Log In");
    panel_submitArticle.loading(false);
    panel_submitArticle.enableForm(true);
    panel_submitArticle.clearForm();
    panel_submitArticle.enableButtons(true, true);
}
//#endregion

//#region Panel : User Articles
function initializePanel_userArticles()
{
    panel_userArticles.initializeButtons(listUserArticles, null);
}

function panel_listUserArticles(amount)
{
    panel_userArticles.clearArticles();

    for (let i = 0; i < amount; i++)
    {
        if (i >= articles.users.length)
            break;

        const article = articles.users[i];
        const articleHtml = article.newHtml("card");

        panel_userArticles.appendArticle(articleHtml);
        articleHtml.initializeButtons(toggleFavorite(article), toggleEdit(article));
        updateArticleButtons(article);
        article.trimHtml();
    }
}
//#endregion

//#region Panel : Random Article
function initializePanel_randomArticle()
{
    panel_randomArticle.show(true);
    panel_randomArticle.initializeButtons(null, panel_randomizeArticle);
    panel_randomizeArticle();
}

async function panel_randomizeArticle()
{
    panel_randomArticle.setTitle("Randomizing");
    panel_randomArticle.loading(true);
    panel_randomArticle.enableButtons(false, false);

    const oldArticle = articles.random;
    const article = await articles.newRandomArticle();
    const articleHtml = articles.random.newHtml("card");

    panel_randomArticle.setTitle("Random Article");
    panel_randomArticle.loading(false);
    panel_randomArticle.enableButtons(false, true);

    panel_randomArticle.clearArticles();
    panel_randomArticle.appendArticle(articleHtml);

    if (oldArticle != null)
        oldArticle.trimHtml();
    articleHtml.initializeButtons(toggleFavorite(article), toggleEdit(article));
    updateArticleButtons(article);
}
//#endregion