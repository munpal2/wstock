let group_money;
let group_stock;
let stock_price;
let current_year = 0;
let current_page = 0;

setting = {
    year_max: 11,
    stock_count: 10,
    group_count: 6,
    stock_name: ["A 제조", "B 제조", "C IT", "D IT", "E 바이오", "F 바이오", "G 금융", "H 엔터", "I 식품", "J 조선"],
    price_initial: [25000, 170000, 140000, 36000, 137000, 80000, 35000, 35000, 20000, 60000],
    money_initial: [1000000, 1000000, 1000000, 1000000, 1000000, 1000000],
    fluctuation: [[-5, 43, 41, -34, 44, 45, -3, -29, -8, -32, 31], 
                    [-11, -2, 6, -24, 5, 59, 28, -27, 14, 25, 4],
                    [-8, 17, 12, -30, 52, 56, 29, -53, 26, -11, 4],
                    [125, -28, -7, -13, 41, 16, 30, -32, 3, -4, -8],
                    [33, -14, 43, -39, -3, 200, -46, -40, -3, 43, -26],
                    [600, -58, 108, -19, -34, 50, -23, 10, 20, -20, 8],
                    [-8, 30, 48, -26, 2, -8, 26, -11, 11, 53, 53],
                    [26, -40, 33, 50, -26, -22, 150, 3, 20, -17, 80],
                    [30, 46, 138, -46, 72, 12, -6, 33, 70, 250, 100],
                    [-72, -11, -37, 145, -18, -1, -15, -17, 49, 40, 200]
                ]
}

//console.log(JSON.stringify(setting));

class Stock {
    constructor(id) {
        this.stock_id = id;
        this.purc_avg = 0;
        this.count = 0;
    }

    add(count) {
        if (this.count + count > 0)
            this.purc_avg = ((this.count * this.purc_avg) + (count * stock_price[this.stock_id])) / (this.count + count);
        else 
            this.purc_avg = 0;
        this.count += count;
    }

    value_prev() {
        return this.purc_avg * this.count;
    }

    value_now() {
        return stock_price[this.stock_id] * this.count;
    }

    fluc() {
        return this.value_now() - this.value_prev();
    }
}

function reset() {
    current_year = 0;
    stock_price = [...(setting.price_initial)];
    group_money = [...(setting.money_initial)];
    group_stock = Array(setting.group_count);
    for (let i = 0;i < setting.group_count;i++) {
        group_stock[i] = Array(setting.stock_count);
        for (let j = 0;j < setting.stock_count;j++) {
            group_stock[i][j] = new Stock(j);
        }
    }
}

document.getElementById("setting-open").addEventListener("click", () => {
    let setting_obj = document.getElementById("setting");
    if (setting_obj.style.display == "none")
        setting_obj.style.display = "block";
    else
        setting_obj.style.display = "none";
})

document.getElementById("apply").addEventListener("click", () => {
    let setting_textarea_obj = document.getElementById("setting-file");
    setting = JSON.parse(setting_textarea_obj.value); 
    //console.log(JSON.parse(setting_textarea_obj.value))
    apply_setting();
})

function get_order_form() {
    return {company: parseInt(document.getElementById("company-select").value), 
    amount: parseInt(document.getElementById("count-select").value)}
}

document.getElementById("buy-btn").addEventListener("click", () => {
    let {company, amount} = get_order_form();
    if (group_money[current_page] >= stock_price[company] * amount) {
        group_money[current_page] -= stock_price[company] * amount;
        group_stock[current_page][company].add(amount);
    }
    refill(current_page);
})

document.getElementById("sell-btn").addEventListener("click", () => {
    let {company, amount} = get_order_form();
    if (group_stock[current_page][company].count >= amount) {
        group_money[current_page] += stock_price[company] * amount;
        group_stock[current_page][company].add(-amount);
    }
    refill(current_page);
})

document.getElementById("next-turn").addEventListener("click", function() {
    if (current_year == setting.year_max)
        return;
    for (let i = 0;i < setting.stock_count;i++) {
        stock_price[i] *= (setting.fluctuation[i][current_year] / 100 + 1);
    }
    set_option();
    current_year += 1;
    this.innerText = `다음 턴 (${current_year}/${setting.year_max})`;
    refill(current_page);
})

function set_option() {
    let dropbox_obj = document.getElementById("company-select");
    dropbox_obj.replaceChildren();
    for (let i = 0;i < setting.stock_count;i++) {
        let opt_obj = document.createElement("option");
        opt_obj.value = i.toString();
        opt_obj.innerText = setting.stock_name[i];
        opt_obj.title = `1주당 ₩${stock_price[i].toFixed(2)}`;
        dropbox_obj.appendChild(opt_obj);
    }
}

function apply_setting() {
    let next_obj = document.getElementById("next-turn");
    next_obj.innerText = `다음 턴 (0/${setting.year_max})`;
    reset();
    set_option();
    refill(current_page);
}

function refill(group_idx) {
    current_page = group_idx;
    document.getElementById("te-group").innerText = `${group_idx + 1}조의 총자산`;

    function fluctuation_helper(fluc, value_prev) {
        return `<span style="color: ${(fluc >= 0 ? "red\">+₩" : "blue\">-₩")}${Math.abs(Math.round(fluc))}
        (${Math.abs(((fluc / value_prev) * 100).toFixed(2))}%)</span>`;
    }
    
    let stocks_obj = document.getElementById("stocks");
    stocks_obj.replaceChildren();

    function push_to_stocks(name, count, value, fluc) {
        let div_obj = document.createElement("div");
        div_obj.innerHTML =    `<div><div class="st-big">${name}</div>
                                <div class="st-small">${count}${count != "" ? "주" : ""}</div></div>
                                <div><div class="st-big st-value">₩${value}</div>
                                <div class="st-small st-fluc">${fluc}</div></div>`
        stocks_obj.appendChild(div_obj);
    }

    let value_sum = group_money[group_idx], fluc_sum = 0, value_sum_prev = group_money[group_idx];
    for (let i = 0;i < setting.stock_count;i++) {
        let cur = group_stock[group_idx][i]; 
        value_sum += cur.value_now();
        value_sum_prev += cur.value_prev();

        if (cur.count != 0) {
            push_to_stocks(setting.stock_name[i], cur.count, Math.round(cur.value_now()), fluctuation_helper(cur.fluc(), cur.value_prev()));
        }
    }
    push_to_stocks("현금", "", Math.round(group_money[group_idx]), "");
    fluc_sum = value_sum - value_sum_prev;

    document.getElementById("te-value").innerText="₩";
    document.getElementById("te-value").style.setProperty("--num", `${Math.round(value_sum)}`);
    document.getElementById("te-fluc").innerHTML = fluctuation_helper(fluc_sum, value_sum_prev)
}

apply_setting();