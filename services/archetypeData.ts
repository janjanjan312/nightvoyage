
export const ARCHETYPE_DESCRIPTIONS: { [key: string]: string } = {
  "The Self (自性)": "心灵的终极核心与完整性。超越小我，象征意识与潜意识的统一。",
  "The Shadow (阴影)": "被压抑的黑暗面。既包含不愿面对的弱点，也潜藏着巨大的生命力。",
  "The Anima (阿尼玛)": "男性内在的女性意象。掌管情感与直觉，是通往潜意识的向导。",
  "The Animus (阿尼姆斯)": "女性内在的男性意象。象征理性与行动力。积极时提供勇气，消极时则化为霸道权威。",
  "The Persona (人格面具)": "适应社会的外部角色。它保护内在，但若过度认同面具，便会迷失真实自我。",
  "The Hero (英雄)": "象征自我意识的觉醒。必须战胜潜意识的吞噬力量（恶龙），历经磨难，完成自我实现。",
  "The Wise Old Man (智慧老人)": "象征精神与古老智慧。在迷途时作为导师出现，但也可能化为僵化的教条。",
  "The Great Mother (大母神)": "生命的源头，兼具滋养与吞噬的双重性。象征对归属的渴望以及被淹没的恐惧。",
  "The Puer Aeternus (永恒少年)": "象征永恒青春与潜能。渴望飞翔、拒绝受限，充满灵性却难以在世俗中落地。",
  "The Trickster (捣蛋鬼)": "混乱与无序的化身。通过打破规则揭示真理，是促成改变与转机的催化剂。",
  "The Child (圣婴/儿童)": "象征新开端与无限潜能。它是过去的遗留，也是通往未来的桥梁，预示人格更新。",
  "The Father (父亲)": "象征权威、秩序与传统。代表外部世界的规则与保护，消极面则表现为压抑性的控制。",
};

export const getArchetypeBaseInfo = (fullName: string) => {
  const match = fullName.match(/^(.*?)\s*(\(.*\))$/);
  return {
    enName: match ? match[1] : fullName,
    zhName: match ? match[2].replace(/[()]/g, '') : '',
    description: ARCHETYPE_DESCRIPTIONS[fullName] || ""
  };
};

