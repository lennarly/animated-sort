// Опции

const AFTER_STORAGE = $('.data--after .data__storage');

const TREE_CONTAINER = '.data--tree';
const BEFORE_STORAGE = '.data--before .data__storage';
const BEFORE_STORAGE_DIV = '.data--before .data__storage div';

const BUBBLE_CONTAINER = '.data--bubble';
const BUBBLE_BLOCK_SELECTOR = '.data--bubble .block';
const BUBBLE_BLOCK_OFFSET = 5;
const BUBBLE_BLOCK_MULTIPLIER = 3;

const SELECTED_COLOR = '#3366CC';
const DEFAULT_COLOR = '#3399FF';
const SURFACED_COLOR = '#66CC66';
const HOVER_COLOR = '#e9ecef';

const BUBBLE_DELAY = 200;
const TREE_DELAY = 500;

/**
 * Класс, представляющий сортировку пузырьком
 */
class BubbleSorting {

    /**
     * @constructor
     */
    constructor(data) {
        this.data = data;
        this.blockSize = ($(BUBBLE_CONTAINER).width() + BUBBLE_BLOCK_OFFSET) / this.data.length;
    }

    /**
     * Рендеринг блоков
     * @returns {Promise<void>}
     */
    async renderBlocks() {

        for (let i = 0; i < this.data.length; i++) {

            const value = this.data[i];
            const block = this.getViewBlock(i, value);

            $(BUBBLE_CONTAINER).append(block);
            block.animate({
                height: value * BUBBLE_BLOCK_MULTIPLIER
            }, BUBBLE_DELAY);

            $(BEFORE_STORAGE_DIV).eq(i).css('background-color', HOVER_COLOR);

            await block.promise();
        }

    }

    /**
     * Обмен местами двух элементов
     * @param $firstElement
     * @param $secondElement
     * @returns {Promise<void>}
     */
    async swap($firstElement, $secondElement) {

        // Получаем значение смещения для блоков
        const $firstElementOffset = $firstElement.css('left');
        const $secondElementOffset = $secondElement.css('left');

        // Меняем блоки местами с анимацией
        $firstElement.animate({ left: $secondElementOffset }, BUBBLE_DELAY);
        $secondElement.animate({ left: $firstElementOffset }, BUBBLE_DELAY);

        // Пауза
        await new Promise(resolve =>
            setTimeout(() => {
                resolve();
            }, BUBBLE_DELAY)
        );

        // Меняем блоки местами в DOM
        $secondElement.insertBefore($firstElement, null);

    }

    /**
     * Запуск визуализации сортировки
     * @returns {Promise<void>}
     */
    async start() {

        // Список всех блоков (чисел)
        let $blocks = $(BUBBLE_BLOCK_SELECTOR);

        // Пробегаемся по циклу
        for (let i = 0; i < $blocks.length - 1; ++i) {

            for (let j = 0; j < $blocks.length - i - 1; ++j) {

                // Элементы текущего и следующего блока
                const $firstBlock = $($blocks[j]);
                const $secondBlock = $($blocks[j + 1]);

                // Помечаем два блока активным цветом
                $firstBlock.css('background-color', SELECTED_COLOR);
                $secondBlock.css('background-color', SELECTED_COLOR);

                // Пауза
                await new Promise(resolve =>
                    setTimeout(() => {
                        resolve();
                    }, BUBBLE_DELAY)
                );

                // Получение чисел из блоков
                const $firstValue = Number($firstBlock.first().text());
                const $secondValue = Number($secondBlock.first().text());

                // Если первый блок > второго, меняем друг друга местами
                if ($firstValue > $secondValue) {
                    await this.swap($firstBlock, $secondBlock);
                    $blocks = $(BUBBLE_BLOCK_SELECTOR);
                }

                // Возвращение стандартного цвета для блоков
                $firstBlock.css('background-color', DEFAULT_COLOR);
                $secondBlock.css('background-color', DEFAULT_COLOR);

            }

            // "Всплытый" блок помечаем цветом готовности
            const $surfacedBlock = $($blocks[$blocks.length - i - 1]);
            $surfacedBlock.css('background-color', SURFACED_COLOR);

            const $element = $('<div>', { text: $surfacedBlock.first().text() });
            AFTER_STORAGE.prepend($element);

        }

        // Первый блок в отсортированном списке помечаем цветом готовности
        const $firstBlock = $($blocks[0]);
        $firstBlock.css('background-color', SURFACED_COLOR);

        const $element = $('<div>', { text: $firstBlock.first().text() });
        AFTER_STORAGE.prepend($element);

    }

    /**
     * Получение HTML элемента блока
     * @param {Number} i
     * @param {Number} value
     * @returns {HTMLDivElement}
     */
    getViewBlock(i, value) {
        return $('<div>', {
            class: 'block',
            css: {
                height: 0,
                width: this.blockSize - BUBBLE_BLOCK_OFFSET,
                left: i * this.blockSize,
                backgroundColor: DEFAULT_COLOR
            },
            html: $('<div>', {
                class: 'block__id',
                text: value
            })
        });
    }

}

/**
 * Класс, представляющий дерево
 */
class TreeLeaf {

    /**
     * Структура дерева
     * @param value
     * @param color
     */
    constructor(value, color) {

        this.id = 0;

        this.rightBranch = null;
        this.leftBranch = null;

        this.hilightPath = true;
        this.hilightNode = true;

        this.color = color;
        this.val = value;

    }

    /**
     * Добавление элемента в дерево
     * @param value
     * @returns {void}
     */
    insert(value) {

        // Включение подсветки
        this.hilightPath = true;

        // По умолчанию левая ветка
        let branch = 'leftBranch',
            isRightBranch = false;

        // Если большее значение, переходим к правой ветке
        if (this.val < value) {
            isRightBranch = true;
            branch = 'rightBranch';
        }

        // Если ветка существует
        if (this[branch]) {
            this[branch].insert(value)
        } else {

            // Иначе создаем новую
            this[branch] = new TreeLeaf(value, isRightBranch ? SELECTED_COLOR : SURFACED_COLOR);
            this.children = this.children || [];

            if (isRightBranch) {
                this.children.push(this[branch])
            } else {
                this.children.unshift(this[branch])
            }

            // Обработка переходов
            update(this[branch]);
        }

        // Очистка подсветки
        this.clearHighlights()
    }

    /**
     * Проход по ветке, применение функции к каждому узлу
     * @param func
     * @returns {void}
     */
    walk(func) {
        if (this.leftBranch) {
            this.leftBranch.walk(func);
        }

        if (typeof func === 'function') {
            func(this);
        }

        if (this.rightBranch) {
            this.rightBranch.walk(func);
        }
    }

    /**
     * Очистка подсветки
     * @returns {void}
     */
    clearHighlights() {

        this.hilightPath = false;
        this.hilightNode = false;

        if (this.leftBranch) {
            this.leftBranch.clearHighlights()
        }

        if (this.rightBranch) {
            this.rightBranch.clearHighlights();
        }
    }


}

/**
 * Обработка элементов SVG и переходов, когда новый элемент (если есть) добавляется в дерево
 * @param nodeToAdd
 * @returns {void}
 */
function update(nodeToAdd) {

    if (nodeToAdd !== undefined) {
        nodeToAdd.id = nodes.length;
        nodes.push(nodeToAdd);
    }

    // Пересчитаем компоновку и объединение данных
    node = node.data(tree.nodes(root), function (d) {
        return d.id;
    });

    link = link.data(tree.links(nodes), function (d) {
        return d.source.id + "-" + d.target.id;
    });

    // Добавление входящих узлов в старой позиции родителя
    const nodeEnter = node.enter()
        .append("g")
        .attr("class", "node");

    nodeEnter.append("circle")
        .attr("class", "node")
        .attr("r", function () {
            return 15;
        });

    // Добавление текстовых меток, появляющихся сверху
    nodeEnter.append("text")
        .attr("class", "text")
        .attr("text-anchor", "middle")
        .text(function (d) {
            return d.val;
        });

    // Добавление ссылок между узлами
    link.enter().insert("path", "g")
        .attr("class", "link")
        .attr("d", diagonal);

    // Переход узлов и ссылки на их новые позиции
    const t = svg.transition()
                .duration(400);

    t.selectAll(".link")
        .attr("d", diagonal).style('stroke', function (d) {
        return d.target.hilightPath ? '#f00' : '#ccc';
    });

    t.selectAll(".node")
        .attr("cx", function (d) {
            return d.px = d.x;
        })
        .attr("cy", function (d) {
            return d.py = d.y;
        });

    t.selectAll("circle").style('stroke', function (d) {
        return d.hilightNode ? '#f00' : d.color;
    });

    t.selectAll(".text")
        .attr("x", function (d) {
            return d.x;
        })
        .attr("y", function (d) {
            return d.y + 4;
        });
}

/**
 * Обработка элементов и переходы при ходьбе по дереву
 * @param id
 * @returns {void}
 */
function updateOut(id) {

    const textOld = d3.selectAll('text').filter(function (d) {
        if (d !== undefined && id === d.id) {
            return d;
        }
    });

    const circle = d3.selectAll('circle').filter(function (d) {
        if (id === d.id) {
            return d;
        }
    });

    $('body').queue('tree', function () {

        circle.transition().duration(400)
            .style("fill", "silver");

        // Извлечение значения из дерева и добавление к отсортированным значениям
        const $element = $('<div>', { text: textOld.data()[0].val });

        AFTER_STORAGE.append($element);
        $element.css('background-color', HOVER_COLOR);

    });

}

/**
 * Начало сортировки
 * @returns {void}
 */
function initSort() {

    // Создание дерева и добавление корневого значения
    treeInstance = new TreeLeaf(arrayToSort.shift());

    svg = d3.select(TREE_CONTAINER).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    tree = d3.layout.tree()
        .size([width - 20, height - 20]);

    root = treeInstance;
    nodes = tree(root);
    diagonal = d3.svg.diagonal();
    node = svg.selectAll(".node");
    link = svg.selectAll(".link");

    // Хранилище чисел (до)
    const $storage = $(BEFORE_STORAGE_DIV);
    $storage.first().css('background-color', HOVER_COLOR);

    // Обработка элементов SVG и переходов
    update();

    // Проход по набору данных
    arrayToSort.forEach(function (elem, idx) {
        $('body').queue('tree', function () {
            $storage.eq(idx + 1).css('background-color', HOVER_COLOR);
            treeInstance.insert(elem);
        });
    });

    // Добавление в очередь
    $('body').queue('tree', function () {

        // Очистка подсветик
        treeInstance.clearHighlights();

        // Обработка переходов
        update();

        // Проход по ветке
        treeInstance.walk(function (leaf) {
            updateOut(leaf.id);
        })
    });

    // Выполнение следующей функция из очереди
    setInterval(function () {
        $('body').dequeue('tree')
    }, TREE_DELAY);
}

/**
 * Сортировка бинарным деревом
 */
let treeInstance, svg, tree, root, nodes, diagonal, node, link;

const margin = {
    top: 20,
    right: 10,
    bottom: 20,
    left: 10
};

const width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

/**
 * Набор данных
 */
const $storage = $(BEFORE_STORAGE);
let arrayToSort = [];

/**
 * Генерация чисел
 * @returns {void}
 */
function generateNumbers() {

    const count = randomInteger(15, 30);

    arrayToSort = [];
    $storage.empty();

    for (let i = 0; i < count; ++i) {
        const value = randomInteger(0, 100);
        const $element = $('<div>', { text: value });

        arrayToSort.push(value);
        $storage.append($element);
    }
}

generateNumbers();

/**
 * Получение случайного числа
 * @param min - минимальное число
 * @param max - максимальное число
 * @returns {number} - результат
 */
function randomInteger(min, max) {
    let rand = min + Math.random() * (max + 1 - min);
    return Math.floor(rand);
}

/**
 * Событие на нажатие кнопки "Сгенерировать набор"
 */
$('button#controls__generate').click(function() {
    generateNumbers();
});

/**
 * Событие на нажатие кнопки "Начать сортировку"
 */
$('button#controls__start').click(function() {

    const $select = $('select#controls__select');
    $select.attr('disabled', 'disabled');

    $('button#controls__start').attr('disabled', 'disabled');
    $('button#controls__generate').attr('disabled', 'disabled');

    if ($select.val() === 'Сортировка пузырьком') {
        $(BUBBLE_CONTAINER).show();
        (async function f() {
            const instance = new BubbleSorting(arrayToSort);
            await instance.renderBlocks();
            await instance.start();
        })();
    } else {
        $(TREE_CONTAINER).show();
        initSort();
    }

});

/**
 * Событие на нажатие кнопки "Сброс"
 */
$('button#controls__reset').click(function() {
    location.reload();
});
