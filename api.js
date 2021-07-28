const api_url = "https://hack-or-snooze-v3.herokuapp.com";

class api    // Full static wrapper class to talk to api
{
    /*/
    These functions return either an error code or a response from the api
    Looking back, I regret not letting this class wrap the responses into the respective data class with a status
    //*/

    static async login(username, password)
    {
        let response;
        try
        {
            response = await axios.post(`${api_url}/login`, { user: { username, password } });
        }
        catch (error)
        {
            return error.response.status;
        }

        return response.data;
    }

    static async getAccount(username, token)
    {
        let response;
        try
        {
            response = await axios.get(`${api_url}/users/${username}`, { params: { token } });
        }
        catch (error)
        {
            return error.response.status;
        }

        return response.data.user;
    }

    static async createAccount(name, username, password)
    {
        let response;
        try
        {
            response = await axios.post(`${api_url}/signup`, { user: { name, username, password } });
        }
        catch (error)
        {
            return error.response.status;
        }

        return response.data;
    }

    static async editAccount(name, password, username, token)
    {
        let response;
        try
        {
            response = await axios.patch(`${api_url}/users/${username}`, { user: { name, password }, token });
        }
        catch (error)
        {
            return error.response.status;
        }

        return response.data.user;
    }

    static async deleteAccount(username, token)
    {
        let response;
        try
        {
            response = await axios.delete(`${api_url}/users/${username}`, { params: { token } });
        }
        catch (error)
        {
            return error.response.status;
        }

        return response.status;
    }


    static async getArticles(skip, limit)
    {
        const response = await axios.get(`${api_url}/stories`, { params: { skip, limit } });

        return response.data.stories;
    }


    static async getArticle(id)
    {
        let response;
        try
        {
            response = await axios.get(`${api_url}/stories/${id}`);
        }
        catch (error)
        {
            return error.response.status;
        }

        return response.data.story;
    }

    static async createArticle(url, title, author, username, token)
    {
        let response;
        try
        {
            response = await axios.post(`${api_url}/stories`, { story: { url, title, author, username }, token });
        }
        catch (error)
        {
            return error.response.status;
        }

        return response.data.story;
    }

    static async editArticle(id, url, title, author, username, token)
    {
        let response;
        try
        {
            response = await axios.patch(`${api_url}/stories/${id}`, { story: { url, title, author }, token });
        }
        catch (error)
        {
            return error.response.status;
        }

        return response.status;
    }

    static async deleteArticle(id, token)
    {
        let response;
        try
        {
            response = await axios.delete(`${api_url}/stories/${id}`, { params: { token } });
        }
        catch (error)
        {
            return error.response.status;
        }

        return response.status;
    }


    static async getRandomArticle(max)    // Recursively searches entire database (by guessing the max index) for random article
    {
        const randomIndex = Math.round(Math.random() * max);    // Obtains a random index from 0 to [max]
        const response = await api.getArticles(randomIndex, 1);    // Attempts to get article at index
        //console.log(`rolled ${randomIndex} out of ${max} and got ${response[0]}`);

        if (response.length == 0)
            return this.getRandomArticle(randomIndex - 1);    // Searches again with random number as max

        return { article: response[0], max };
    }


    static async addFavorite(username, id, token)
    {
        let response;
        try
        {
            response = await axios.post(`${api_url}/users/${username}/favorites/${id}`, { token });
        }
        catch (error)
        {
            return error.response.status;
        }

        return response.status;
    }

    static async delFavorite(username, id, token)
    {
        let response;
        try
        {
            response = await axios.delete(`${api_url}/users/${username}/favorites/${id}`, { params: { token } });
        }
        catch (error)
        {
            console.log(error);
            return error.response.status;
        }

        return response.status;
    }
}