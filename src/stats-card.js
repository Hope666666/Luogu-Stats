const axios = require("axios");
let { uid, client_id, maxConcurrency } = require("../setting.js");
const {
    Card,
    renderError,
    renderChart,
    renderNameTitle,
    ToType,
} = require("./common.js");

/**
 * 
 * @param {number} id 用户id
 * @returns {Object} 获取的用户数据 {name, color, ccfLevel, total, hideInfo}
 */

const Basic = {
    name: "NULL",
    color: "Gray",
    ccfLevel: 0,
    total: new Array(42).fill(0),  // 数组的大小是42，初始化为0
    hideInfo: false,
    Error: false
};

async function fetchStats(id) {
    const stats = Basic;
    let cnt = 1;
    let flag = 0;
    const allRecords = [];  // 用于存储所有页面的记录

    // 发起请求的函数
    async function fetchPage(page) {
        if (stats.Error) return null;
        const reqUrl = `https://www.luogu.com.cn/record/list?user=${id}&status=12&page=${page}&_contentOnly`;
        let ord = Math.floor(Math.random() * uid.length);
        const reqCookie = `_uid=${uid[ord]};__client_id=${client_id[ord]}`;
        try {
            const res = await axios.get(reqUrl, {
                headers: {
                    "Cookie": reqCookie
                },
            });
            if (res.data.code !== 200) {
                throw new Error('Non-200 status code received');
            }

            return res.data.currentData.records.result;
        } catch (error) {
            console.error('Request failed', error);
            stats.Error = 1;
            //   console.log(stats.Error);
            return null;
        }
    }

    // 发起多个请求并发执行
    async function fetchPagesInBatch(startPage, concurrency) {
        const requests = [];
        for (let i = 0; i < concurrency; i++) {
            const page = startPage + i;
            requests.push(fetchPage(page));  // 发起多个请求
        }
        // 等待当前批次的所有请求完成
        if (stats.Error) return null;
        return await Promise.all(requests);
    }

    // 处理所有页面的请求
    async function fetchAllPages() {
        let batchSize = maxConcurrency;
        let currentPage = cnt;

        while (true) {
            // 批量请求当前页和后续的页
            const results = await fetchPagesInBatch(currentPage, batchSize);
            if (stats.Error) return Basic;
            let hasEmptyRecord = false;
            for (let record of results) {
                if (record === null || JSON.stringify(record) === '[]') {
                    hasEmptyRecord = true;  // 如果任何一页为空，则停止
                    break;
                }

                // 存储当前页面的记录到 allRecords
                allRecords.push(...record);

                // 如果还没有设置用户信息
                if (!flag) {
                    const user = record[0].user;
                    stats.name = user.name;
                    stats.color = user.color;
                    stats.ccfLevel = user.ccfLevel;
                    flag = 1;
                }

                // 累加当前页面的数据
                for (let i of record) {
                    stats.total[i.language] += i.sourceCodeLength;
                }
            }

            // 如果有空记录，停止请求
            if (hasEmptyRecord) {
                const reqUrl = `https://www.luogu.com.cn/record/list?user=${id}&status=12&page=1&_contentOnly`;
                let ord = Math.floor(Math.random() * uid.length);
                const reqCookie = `_uid=${uid[ord]};__client_id=${client_id[ord]}`;
                try {
                    const res = await axios.get(reqUrl, {
                        headers: {
                            "Cookie": reqCookie
                        },
                    });

                    if (res.data.code !== 200) {
                        throw new Error('Non-200 status code received');
                    }

                    if (JSON.stringify(res.data.currentData.records.result[0]) == '[]') stats.hideInfo = 1;
                } catch (error) {
                    console.error('Request failed', error);
                    return Basic;  // 如果请求出错，返回 null
                }
                break;
            }

            // 更新下一批次的请求页面
            currentPage += batchSize;
        }

        return stats;
    }

    // 启动并发请求
    return fetchAllPages();
}

const renderSVG = (stats, options) => {
    const {
        name,
        color,
        ccfLevel,
        total,
        hideInfo,
        Error
    } = stats;

    const {
        hideTitle,
        darkMode,
        cardWidth = 500,
    } = options || {};

    if (Error) {
        return renderError("出现了一些问题，可能请求过于频繁，提出ISSUE或稍后再试")
    }
    if (hideInfo) {
        return renderError("用户开启了“完全隐私保护”，获取数据失败");
    }

    const paddingX = 25;
    const labelWidth = 90;  //柱状图头部文字长度
    const progressWidth = cardWidth - 2 * paddingX - labelWidth - 60; //500 - 25*2(padding) - 90(头部文字长度) - 60(预留尾部文字长度)，暂时固定，后序提供自定义选项;

    const datas = [
        { label: "C++", color: "#bfbfbf", data: total[2] + total[3] + total[4] + total[11] + total[12] + total[27] + total[28] },
        { label: "Pascal", color: "#fe4c61", data: total[1] },
        { label: "Python", color: "#f39c11", data: total[7] + total[25] },
        { label: "Java", color: "#ffc116", data: total[8] + total[33] },
        { label: "Rust", color: "#52c41a", data: total[15] },
        { label: "Go", color: "#3498db", data: total[14] },
        { label: "Haskell", color: "#9d3dcf", data: total[19] },
        { label: "OCaml", color: "#0e1d69", data: total[30] },
    ]
    datas.sort(function (a, b) {
        return b.data - a.data;
    })
    for (let i = datas.length - 1; i >= 0; i--) {
        if (datas[i].data == 0) datas.pop();
    }
    const totalSum = total.reduce((a, b) => a + b);
    const body = renderChart(datas, labelWidth, progressWidth);
    const title = renderNameTitle(name, color, ccfLevel, "的代码语言", cardWidth, `已通过: ${ToType(totalSum)}`);

    return new Card({
        width: cardWidth - 2 * paddingX,
        height: datas.length * 30 + 10,
        hideTitle,
        darkMode,
        title,
        body,
    }).render();
}

module.exports = { fetchStats, renderSVG }
