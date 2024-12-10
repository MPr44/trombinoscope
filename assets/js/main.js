// URL du fichier JSON contenant les données des employés
const DATA_URL = '/assets/data/trombinoscope_data_french.json';

// Paramètres dimensionnels de chaque boîte et espaces entre niveaux
const nodeWidth = 200;    // Largeur d'une boîte employé
const nodeHeight = 120;   // Hauteur approximative d'une boîte employé
const levelSpacing = 100; // Espace vertical entre niveaux hiérarchiques
const siblingSpacing = 40; // Espace horizontal entre "frères" (employés d'un même niveau sous un même manager)

// Au chargement du DOM
document.addEventListener('DOMContentLoaded', () => {
  // On charge les données JSON
  fetch(DATA_URL)
    .then(response => response.json())
    .then(data => {
      // On construit la hiérarchie
      const root = buildHierarchy(data);
      if (root) {
        // On calcule le layout (positions x,y des nœuds)
        const {nodes, edges} = computeLayout(root);

        // Sélection des éléments du DOM
        const chartInner = document.querySelector('.chart-inner');
        const svg = document.querySelector('.org-lines');

        // On crée un div pour chaque employé (chaque nœud)
        nodes.forEach(node => {
          const div = document.createElement('div');
          div.className = 'org-node';
          // Position absolue selon x et y calculés
          div.style.top = node.y + 'px';
          div.style.left = node.x + 'px';

          // Contenu de la boîte employé
          div.innerHTML = `
            <img src="${node.data.photo}" alt="${node.data.prenom} ${node.data.nom}" />
            <h3>${node.data.prenom} ${node.data.nom}</h3>
            <p>${node.data.poste}</p>
            <p>Age : ${getAgeFromBirthdayDate(node.data.dateNaissance).toFixed(0)} ans</p>
          `;
          chartInner.appendChild(div);
        });

        // On dessine les lignes entre parents et enfants
        edges.forEach(edge => {
          const path = document.createElementNS('http://www.w3.org/2000/svg','path');
          path.setAttribute('d', drawLine(edge));
          path.setAttribute('stroke', '#ccc');
          path.setAttribute('fill', 'none');
          path.setAttribute('stroke-width', '2');
          svg.appendChild(path);
        });

        // Calcul des dimensions nécessaires pour englober tout l'organigramme
        let maxX = 0, maxY = 0;
        nodes.forEach(node => {
          const rightX = node.x + nodeWidth;
          const bottomY = node.y + nodeHeight;
          if (rightX > maxX) maxX = rightX;
          if (bottomY > maxY) maxY = bottomY;
        });

        // Ajout d'une marge pour éviter que le dessin soit collé au bord
        const margin = 100;
        maxX += margin;
        maxY += margin;

        // On ajuste la taille du SVG et du conteneur interne
        svg.setAttribute('width', maxX);
        svg.setAttribute('height', maxY);
        chartInner.style.width = maxX + 'px';
        chartInner.style.height = maxY + 'px';
      }
    })
    .catch(err => console.error(err));
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
