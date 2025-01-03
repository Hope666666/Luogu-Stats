const axios = require("axios");
let { uid, client_id } = require("../setting.js");
const {
  Card,
  renderError,
  renderChart,
  renderNameTitle,
} = require("./common.js");

/**
 * 
 * @param {number} id 用户id
 * @returns {Object} 获取的用户数据 {name, color, ccfLevel, total, hideInfo}
 */
const stats = {
    name: "NULL",
    color: "Gray",
    ccfLevel: 0,
    total: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    hideInfo: false
}
async function fetchStats(id) {
    var cnt = 1,flag=0;
    while (1) {
        let reqUrl = `https://www.luogu.com.cn/record/list?user=${id}&status=12&page=${cnt}&_contentOnly`;
        let reqCookie = `_uid=${uid};__client_id=${client_id}`;
        let res = await axios.get(reqUrl, {
            headers: {
                "Cookie": reqCookie
            },
        });
        ++cnt;
        if (res.data.code !== 200) {
            return stats;
        }
        const record = res.data.currentData.records.result;
        if (JSON.stringify(record) == '[]') {
            if (!flag) {
                stats.hideInfo = 1;
            }
            return stats;
        }
        if (!flag) {
            const user = record[0].user;
            stats.name = user.name;
            stats.color = user.color;
            stats.ccfLevel = user.ccfLevel;
        }
        if (record) flag = 1;
        for (let i of record) {
            stats.total[i.language] += i.sourceCodeLength;
        }
    }

  return stats;
} 

const renderSVG = (stats, options) => {
  const {
    name,
    color,
    ccfLevel,
    total,
    hideInfo
  } = stats;

  const { 
    hideTitle, 
    darkMode,
    cardWidth = 500, 
  } = options || {};

  if(hideInfo) {
    return renderError("用户开启了“完全隐私保护”，获取数据失败");
  }
  
  const paddingX = 25;
  const labelWidth = 90;  //柱状图头部文字长度
  const progressWidth = cardWidth - 2*paddingX - labelWidth - 60; //500 - 25*2(padding) - 90(头部文字长度) - 60(预留尾部文字长度)，暂时固定，后序提供自定义选项;

  const datas = [
    {label: "C++", color:"#bfbfbf", data: total[2]+total[3]+total[4]+total[5]+total[6]+total[7]+total[28]},
    {label: "Pascal", color:"#fe4c61", data: total[1]},
    {label: "Python", color:"#f39c11", data: total[8]+total[9]},
    {label: "Java", color:"#ffc116", data: total[10]+total[11]},
    {label: "Rust", color:"#52c41a", data: total[12]},
    {label: "Go", color: "#3498db", data: total[13]},
    {label: "Haskell", color:"#9d3dcf", data: total[14]},
      { label: "OCaml", color: "#0e1d69", data: total[15] },
  ]
  const totalSum = total.reduce((a, b) => a + b);
  const body = renderChart(datas, labelWidth, progressWidth, "KB");

    const title = renderNameTitle(name, color, ccfLevel, "的代码语言", cardWidth, `已敲: ${Math.round(totalSum/1024)}KB`);

  return new Card({
    width: cardWidth - 2*paddingX,
    height: datas.length*30 + 10,
    hideTitle,
    darkMode,
    title,
    body,
  }).render();
}

module.exports = { fetchStats, renderSVG }
