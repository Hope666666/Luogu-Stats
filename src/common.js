const renderError = (message, secondaryMessage = "", options = {}) => {
    const {
        title_color,
        text_color,
        bg_color,
        border_color,
        theme = "default",
    } = options;

    // returns theme based colors with proper overrides and defaults
    const { titleColor, textColor, bgColor, borderColor } = getCardColors({
        title_color,
        text_color,
        icon_color: "",
        bg_color,
        border_color,
        ring_color: "",
        theme,
    });

    return `
    <svg width="${ERROR_CARD_LENGTH}"  height="120" viewBox="0 0 ${ERROR_CARD_LENGTH} 120" fill="${bgColor}" xmlns="http://www.w3.org/2000/svg">
    <style>
    .text { font: 600 16px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${titleColor} }
    .small { font: 600 12px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${textColor} }
    .gray { fill: #858585 }
    </style>
    <rect x="0.5" y="0.5" width="${ERROR_CARD_LENGTH - 1
        }" height="99%" rx="4.5" fill="${bgColor}" stroke="${borderColor}"/>
    <text x="25" y="45" class="text">Something went wrong!${UPSTREAM_API_ERRORS.includes(secondaryMessage)
            ? ""
            : " file an issue at https://tiny.one/readme-stats"
        }</text>
    <text data-testid="message" x="25" y="55" class="text small">
      <tspan x="25" dy="18">${encodeHTML(message)}</tspan>
      <tspan x="25" dy="18" class="gray">${secondaryMessage}</tspan>
    </text>
    </svg>
  `;
};