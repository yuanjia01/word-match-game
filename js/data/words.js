/* 词库数据（原 index.html 数据原样迁移，仅包含 const 定义，不含任何逻辑） */

/* 泡泡配色盘 */
const PALETTE = ['#FF6B6B', '#FF8E53', '#F7B32B', '#4CAF7D', '#4D96FF', '#9B59B6', '#FF8FB1', '#00A8C6', '#F76E11', '#8BC34A', '#845EC2', '#FF9671', '#C34A2C', '#0089BA', '#D65DB1', '#3AB795', '#FF8066', '#5D9CEC', '#E17055', '#74B816'];

/* 难度标签 */
const GRADE_LABELS = {
  all: '全部词库',
  lower: '低年级',
  upper: '高年级',
  middle: '初中'
};

/* 分级词表（英文单词 -> 所属难度） */
const GRADE_WORDS = {
  lower: new Set(`
    apple banana orange pear grape peach cat dog bird fish rabbit tiger panda horse cow pig duck bear mouse
    book pen pencil ruler eraser schoolbag desk chair box ball kite doll clock watch red blue green yellow black
    white pink brown car bus bike plane train boat water milk tea juice bread rice egg cake candy sugar father
    mother brother sister family friend baby grandpa grandma sun moon star rain snow wind sky tree flower happy sad
    big small tall short hot cold good bad park zoo home morning today head eye ear nose mouth hand foot leg arm
    hair face tooth shirt dress hat cap shoe football swimming
  `.trim().split(/\s+/)),
  upper: new Set(`
    watermelon mango lemon cherry tomato melon monkey lion sheep chicken fox frog goat phone computer camera paper
    notebook classroom library purple gray gold ship taxi truck noodles pizza soup meat ham salt potato carrot corn
    bean doctor nurse farmer worker driver cook uncle aunt cloud grass river lake sea fast slow new old long clean
    cute shop farm garden street city station week year summer skirt coat sock running jumping
  `.trim().split(/\s+/)),
  middle: new Set(`
    strawberry pineapple kiwi plum elephant wolf snake turtle giraffe kangaroo zebra deer donkey goose blackboard
    chalk dictionary homework silver subway coffee dumpling hamburger sandwich salad porridge cheese butter vegetable
    cabbage onion mushroom cucumber policeman artist singer actor cousin mountain forest island rainbow thunder fog
    dirty hungry thirsty tired angry strong weak hospital supermarket village airport restaurant museum afternoon
    evening tomorrow yesterday month spring autumn winter trousers glove scarf sweater basketball volleyball tennis boxing
  `.trim().split(/\s+/))
};

/* 中英文配对词库 */
const BASE_WORDS = [
  ['apple', '苹果'], ['banana', '香蕉'], ['orange', '橙子'], ['grape', '葡萄'], ['pear', '梨'],
  ['peach', '桃子'], ['watermelon', '西瓜'], ['strawberry', '草莓'], ['mango', '芒果'], ['lemon', '柠檬'],
  ['cherry', '樱桃'], ['pineapple', '菠萝'], ['kiwi', '猕猴桃'], ['tomato', '西红柿'], ['melon', '哈密瓜'], ['plum', '李子'],
  ['cat', '猫'], ['dog', '狗'], ['bird', '鸟'], ['fish', '鱼'], ['rabbit', '兔子'],
  ['monkey', '猴子'], ['tiger', '老虎'], ['lion', '狮子'], ['elephant', '大象'], ['panda', '熊猫'],
  ['horse', '马'], ['cow', '奶牛'], ['pig', '猪'], ['sheep', '绵羊'], ['duck', '鸭子'],
  ['chicken', '鸡'], ['bear', '熊'], ['wolf', '狼'], ['fox', '狐狸'], ['mouse', '老鼠'],
  ['snake', '蛇'], ['frog', '青蛙'], ['turtle', '乌龟'], ['giraffe', '长颈鹿'], ['kangaroo', '袋鼠'],
  ['zebra', '斑马'], ['deer', '鹿'], ['goat', '山羊'], ['donkey', '驴'], ['goose', '鹅'],
  ['book', '书'], ['pen', '钢笔'], ['pencil', '铅笔'], ['ruler', '尺子'], ['eraser', '橡皮'],
  ['schoolbag', '书包'], ['desk', '课桌'], ['chair', '椅子'], ['box', '盒子'], ['ball', '皮球'],
  ['kite', '风筝'], ['doll', '洋娃娃'], ['clock', '钟表'], ['watch', '手表'], ['phone', '手机'],
  ['computer', '电脑'], ['camera', '相机'], ['paper', '纸张'], ['blackboard', '黑板'], ['chalk', '粉笔'],
  ['notebook', '笔记本'], ['classroom', '教室'], ['library', '图书馆'], ['dictionary', '词典'], ['homework', '作业'],
  ['red', '红色'], ['blue', '蓝色'], ['green', '绿色'], ['yellow', '黄色'], ['black', '黑色'],
  ['white', '白色'], ['pink', '粉色'], ['purple', '紫色'], ['brown', '棕色'], ['gray', '灰色'],
  ['gold', '金色'], ['silver', '银色'],
  ['car', '汽车'], ['bus', '公交车'], ['bike', '自行车'], ['plane', '飞机'], ['train', '火车'],
  ['ship', '轮船'], ['boat', '小船'], ['taxi', '出租车'], ['truck', '卡车'], ['subway', '地铁'],
  ['water', '水'], ['milk', '牛奶'], ['tea', '茶'], ['juice', '果汁'], ['coffee', '咖啡'],
  ['bread', '面包'], ['rice', '米饭'], ['egg', '鸡蛋'], ['cake', '蛋糕'], ['candy', '糖果'],
  ['noodles', '面条'], ['dumpling', '饺子'], ['hamburger', '汉堡包'], ['pizza', '披萨'], ['sandwich', '三明治'],
  ['salad', '沙拉'], ['soup', '汤'], ['porridge', '粥'], ['meat', '肉'], ['ham', '火腿'],
  ['cheese', '奶酪'], ['butter', '黄油'], ['sugar', '糖'], ['salt', '盐'], ['vegetable', '蔬菜'],
  ['potato', '土豆'], ['carrot', '胡萝卜'], ['cabbage', '卷心菜'], ['onion', '洋葱'], ['mushroom', '蘑菇'],
  ['cucumber', '黄瓜'], ['corn', '玉米'], ['bean', '豆子'],
  ['father', '爸爸'], ['mother', '妈妈'], ['brother', '哥哥'], ['sister', '妹妹'], ['family', '家庭'],
  ['friend', '朋友'], ['doctor', '医生'], ['nurse', '护士'], ['farmer', '农民'], ['worker', '工人'],
  ['driver', '司机'], ['cook', '厨师'], ['policeman', '警察'], ['artist', '画家'], ['singer', '歌手'],
  ['actor', '演员'], ['baby', '婴儿'], ['grandpa', '爷爷'], ['grandma', '奶奶'], ['uncle', '叔叔'],
  ['aunt', '阿姨'], ['cousin', '表兄妹'],
  ['sun', '太阳'], ['moon', '月亮'], ['star', '星星'], ['rain', '雨'], ['snow', '雪'],
  ['wind', '风'], ['cloud', '云'], ['sky', '天空'], ['tree', '树'], ['flower', '花'],
  ['grass', '草'], ['river', '河流'], ['lake', '湖泊'], ['sea', '大海'], ['mountain', '高山'],
  ['forest', '森林'], ['island', '岛屿'], ['rainbow', '彩虹'], ['thunder', '雷声'], ['fog', '雾'],
  ['happy', '开心的'], ['sad', '伤心的'], ['big', '大的'], ['small', '小的'], ['tall', '高的'],
  ['short', '矮的'], ['hot', '热的'], ['cold', '冷的'], ['fast', '快的'], ['slow', '慢的'],
  ['new', '新的'], ['old', '旧的'], ['good', '好的'], ['bad', '坏的'], ['long', '长的'],
  ['clean', '干净的'], ['dirty', '脏的'], ['hungry', '饥饿的'], ['thirsty', '口渴的'], ['tired', '劳累的'],
  ['angry', '生气的'], ['cute', '可爱的'], ['strong', '强壮的'], ['weak', '虚弱的'],
  ['park', '公园'], ['zoo', '动物园'], ['home', '家'], ['hospital', '医院'], ['shop', '商店'],
  ['supermarket', '超市'], ['farm', '农场'], ['garden', '花园'], ['street', '街道'], ['village', '村庄'],
  ['city', '城市'], ['station', '车站'], ['airport', '机场'], ['restaurant', '饭店'], ['museum', '博物馆'],
  ['morning', '早晨'], ['afternoon', '下午'], ['evening', '晚上'], ['today', '今天'], ['tomorrow', '明天'],
  ['yesterday', '昨天'], ['week', '星期'], ['month', '月份'], ['year', '年'], ['spring', '春天'],
  ['summer', '夏天'], ['autumn', '秋天'], ['winter', '冬天'],
  ['head', '头'], ['eye', '眼睛'], ['ear', '耳朵'], ['nose', '鼻子'], ['mouth', '嘴巴'],
  ['hand', '手'], ['foot', '脚'], ['leg', '腿'], ['arm', '手臂'], ['hair', '头发'],
  ['face', '脸'], ['tooth', '牙齿'],
  ['shirt', '衬衫'], ['dress', '连衣裙'], ['skirt', '裙子'], ['coat', '外套'], ['hat', '帽子'],
  ['cap', '鸭舌帽'], ['shoe', '鞋子'], ['sock', '袜子'], ['trousers', '裤子'], ['glove', '手套'],
  ['scarf', '围巾'], ['sweater', '毛衣'],
  ['football', '足球'], ['basketball', '篮球'], ['volleyball', '排球'], ['tennis', '网球'],
  ['swimming', '游泳'], ['running', '跑步'], ['jumping', '跳跃'], ['boxing', '拳击']
];