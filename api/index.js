import { renderError } from "../src/common.js"
return res.send(
    renderError("Something went wrong", "This username is blacklisted", {
        title_color,
        text_color,
        bg_color,
        border_color,
        theme,
    }),
);