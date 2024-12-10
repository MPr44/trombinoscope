// URL du fichier JSON contenant les données des employés
// const DATA_URL = '/assets/data/trombinoscope_data_french.json';

// Paramètres dimensionnels de chaque boîte et espaces entre niveaux
const nodeWidth = 200;    // Largeur d'une boîte employé
const nodeHeight = 120;   // Hauteur approximative d'une boîte employé
const levelSpacing = 100; // Espace vertical entre niveaux hiérarchiques
const siblingSpacing = 40; // Espace horizontal entre "frères" (employés d'un même niveau sous un même manager)

function init() {

  const main = document.querySelector('main')

  // On supprime l'ancien conteneur s'il existe
  const oldContainer = document.querySelector('.org-container')
  if (oldContainer) oldContainer.remove()

  // Création du nouveau conteneur
  const orgContainer = document.createElement('div')
  orgContainer.classList.add('org-container')

  const chartInner = document.createElement('div')
  chartInner.classList.add('chart-inner')

  // Création du SVG avec createElementNS pour s'assurer de l'espace de noms
  const orgLines = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  orgLines.classList.add('org-lines')

  // On assemble les éléments
  chartInner.appendChild(orgLines)
  orgContainer.appendChild(chartInner)
  main.appendChild(orgContainer)

  // Récupération des données
  const data = getAllItems()
  const root = buildHierarchy(data);

  if (root) {
    // Calcul du layout
    const {nodes, edges} = computeLayout(root);

    // Insertion des boîtes représentant les employés
    nodes.forEach(node => {
      const div = document.createElement('div');
      div.className = 'org-node';
      div.style.top = node.y + 'px';
      div.style.left = node.x + 'px';

      div.innerHTML = `
        <img src="${node.data.photo}" alt="${node.data.prenom} ${node.data.nom}" />
        <h3>${node.data.prenom} ${node.data.nom}</h3>
        <p>${node.data.poste}</p>
        <p>Age : ${getAgeFromBirthdayDate(node.data.dateNaissance).toFixed(0)} ans</p>
        <button onclick="removeItem(${node.data.id});init();">🗑️</button>
      `;
      chartInner.appendChild(div);
    });

    // Dessin des lignes dans le SVG
    edges.forEach(edge => {
      const path = document.createElementNS('http://www.w3.org/2000/svg','path');
      path.setAttribute('d', drawLine(edge));
      path.setAttribute('stroke', '#ccc');
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke-width', '2');
      orgLines.appendChild(path);
    });

    // Calcul des dimensions pour englober tout l'organigramme
    let maxX = 0, maxY = 0;
    nodes.forEach(node => {
      const rightX = node.x + nodeWidth;
      const bottomY = node.y + nodeHeight;
      if (rightX > maxX) maxX = rightX;
      if (bottomY > maxY) maxY = bottomY;
    });

    // Marge pour éviter d'avoir le dessin collé au bord
    const margin = 100;
    maxX += margin;
    maxY += margin;

    // Ajustement de la taille du SVG et du conteneur interne
    orgLines.setAttribute('width', maxX);
    orgLines.setAttribute('height', maxY);
    chartInner.style.width = maxX + 'px';
    chartInner.style.height = maxY + 'px';
  }
}


// Au chargement du DOM
document.addEventListener('DOMContentLoaded', () => {
  init()
  loadSelect()
});

/**
 * Construit la hiérarchie à partir des données brutes.
 * On place chaque employé dans une structure de type arbre.
 * Le PDG (lienHierarchique = null) devient la racine.
 * Les autres sont attachés à leur manager selon leur lienHierarchique.
 *
 * @param {Array} data Tableau d'employés
 * @return {Object} L'employé racine (PDG) avec la hiérarchie complète
 */
function buildHierarchy(data) {
  const map = new Map();
  // On crée une map id => employé (copie de l'objet + children: [])
  data.forEach(emp => {
    map.set(emp.id, {...emp, children: []});
  });

  let root = null;
  // On lie chaque employé à son parent
  map.forEach(emp => {
    if (emp.lienHierarchique === null) {
      root = emp; // C'est le PDG (racine)
    } else {
      const parent = map.get(emp.lienHierarchique);
      if (parent) parent.children.push(emp);
    }
  });
  return root;
}

/**
 * Calcule le layout de l'arbre (positions des nœuds)
 * @param {Object} root La racine de la hiérarchie
 * @return {Object} {nodes, edges} 
 *  nodes : liste d'objets {data, x, y}
 *  edges : liste d'objets {x1, y1, x2, y2} pour tracer les lignes
 */
function computeLayout(root) {
  const tree = layoutNode(root);
  const {n, e} = assignPositionsImproved(tree, 0, 0);
  return {nodes: n, edges: e};
}

/**
 * Calcule les dimensions d'un sous-arbre (width, height)
 * de manière récursive, sans encore positionner les nœuds.
 * @param {Object} node Noeud (employé) courant
 * @return {Object} Objet avec {width, height, node, children[]}
 */
function layoutNode(node) {
  if (!node.children || node.children.length === 0) {
    // Pas d'enfants => taille de base
    return { width: nodeWidth, height: nodeHeight, node, children: [] };
  }

  // On calcule la taille de chaque sous-arbre enfant
  const childrenLayouts = node.children.map(layoutNode);

  // La largeur totale est la somme des largeurs enfants + espaces entre eux
  const totalWidth = childrenLayouts.reduce((sum, c) => sum + c.width, 0) 
                    + siblingSpacing * (childrenLayouts.length - 1);

  // La hauteur du sous-arbre = hauteur du parent + espace + max hauteur enfants
  const treeHeight = nodeHeight + levelSpacing + Math.max(...childrenLayouts.map(c => c.height), 0);

  return {
    width: Math.max(nodeWidth, totalWidth),
    height: treeHeight,
    node,
    children: childrenLayouts
  };
}

/**
 * Assigne les positions (x, y) réelles à chaque nœud et construit aussi
 * la liste des arêtes (edges) entre parent et enfants.
 * @param {Object} subtree Structure retournée par layoutNode
 * @param {number} left Position x du coin gauche pour ce sous-arbre
 * @param {number} top Position y du haut pour ce sous-arbre
 * @return {Object} {n, e} où n = liste des nœuds positionnés, e = liste des edges
 */
function assignPositionsImproved(subtree, left, top) {
  const {node, children, width} = subtree;

  // Le nœud courant est centré horizontalement sur la largeur totale du sous-arbre
  const nodeX = left + width/2 - nodeWidth/2;
  const nodeY = top;

  // Le noeud courant
  let currentNodes = [{
    data: node,
    x: nodeX,
    y: nodeY
  }];

  let currentEdges = [];

  // S'il y a des enfants, on les positionne en dessous
  if (children.length > 0) {
    let currentX = left;
    const parentMidX = nodeX + nodeWidth/2;     // centre horizontal du parent
    const parentMidY = nodeY + nodeHeight;      // bas du parent

    for (let c of children) {
      // On place l'enfant en partant de currentX, à un niveau en dessous
      const {n, e} = assignPositionsImproved(c, currentX, top + nodeHeight + levelSpacing);
      currentX += c.width + siblingSpacing;

      // Le premier nœud du sous-arbre enfant est la racine enfant
      const childNode = n[0];
      const childMidX = childNode.x + nodeWidth/2; // centre de l'enfant
      const childMidY = childNode.y;

      // On ajoute une arête entre le parent et l'enfant
      currentEdges.push({x1: parentMidX, y1: parentMidY, x2: childMidX, y2: childMidY});

      // On fusionne les nœuds et edges du sous-arbre enfant
      currentNodes = currentNodes.concat(n);
      currentEdges = currentEdges.concat(e);
    }
  }

  return {n: currentNodes, e: currentEdges};
}

/**
 * Dessine une ligne en "U" entre le parent et l'enfant
 * On part du bas du parent vers le haut de l'enfant.
 * @param {Object} edge {x1, y1, x2, y2} coordonnées parent et enfant
 * @return {string} path d'un SVG path
 */
function drawLine(edge) {
  const {x1, y1, x2, y2} = edge;
  const midY = (y1 + y2) / 2;
  // On dessine d'abord une ligne verticale vers le milieu,
  // puis une ligne horizontale, puis une ligne verticale vers l'enfant.
  return `M ${x1} ${y1} L ${x1} ${midY} L ${x2} ${midY} L ${x2} ${y2}`;
}
