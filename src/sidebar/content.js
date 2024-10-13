import { createFromYourQuillSection } from "./fromYourQuill.js";

const quillSection = createFromYourQuillSection();

export const content = {
  "about-strix": {
    "what-is-strix": {
      title: "What is Strix?",
      body: `
        <p>STRIX is a game for three players, played in three dimensions.</p>

        <p>Inspired by the aerial agility of birds, the STRIX board and pieces represent a forest, dense but criss-crossed with sunlit glades, through which three teams of birds, each comprising an Owl, a Kite and a Raven vie to reach the Owl's nest at the centre of the board.</p>

        <p>Each player – Brown, Yellow and Green – starts the game with three pieces – an 'Owl', a 'Kite' and a 'Raven' – and aims to move the Owl to the board's centre – the 'Owl's Nest'.</p>

        <p>The physical version of STRIX is crafted with meticulous attention to detail, typically using high-quality materials to bring the game to life. The online version replicates this tactile experience in a digital format, allowing players to enjoy STRIX from anywhere in the world.</p>
        
        <p>Simple to learn and with only three pieces for each player to control, STRIX surprises in the speed with which positions of startling tactical and diplomatic complexity arise.</p>

        <p>Does your Owl have the vision and wisdom to win?</p>
      `,
    },
    "game-history": {
      title: "History of Strix",
      body: `
       <h1>The Fledging of Strix</h1>

        <p>Strix traces its origins to a serendipitous moment in late 1984. As David Priestley walked with friends from the Green Man pub in Muswell Hill towards Alexandra Palace, the incline of their route sparked an idea. The angle of the path, first descending then ascending, inspired the concept of game boards facing each other at angles. The friends, as they traversed this terrain, seemed to David like tall game pieces moving across these imagined planes.</p>

        <h2>From Concept to Prototype</h2>
        <p>Living in Blackheath, David experimented with various prototypes using folded cardboard and knitting needles. The first Strix set emerged from a sawn-up plank and a garden tile, embodying the game's unique 3D nature.</p>
        <p>The theme of birds in a forest naturally evolved from the board's three-dimensional structure and the branch-like crisscrossed appearance of pieces during play. As the concept took shape, David enlisted his old school friend, Jonathan Moody, to help formalize the rules. Jonathan's incisive intellect transformed David's initial concepts into a robust and coherent ruleset, much of which still forms the backbone of the current official rulebook.</p>

        <h2>Early Development and Production</h2>
        <p>In 1986, on the advice of the proprietor of Just Games in London, David and Jonathan collaborated with Jeff Tye, a wooden games maker based in Kempston. Jeff undertook the production of 100 Strix sets, screen-printed on MDF with stained beech-rod pieces. The rules were hand-coloured, featuring cover art by Kate Giles, and the fully demountable sets were packaged in cardboard boxes.</p>

        <h2>Public Debut and Recognition</h2>
        <p>1987 marked Strix's public debut. Jeff Tye showcased a set at the British Craft Show, resulting in the game's first published image. Around the same time, David and Jonathan exhibited at the London Toy Fair in Olympia, garnering significant interest. The game caught the attention of David Pritchard, the renowned expert on chess variants, who included Strix in his "Classified Encyclopedia of Chess Variants."</p>
        <p>Following successful exhibitions at various craft fairs, a large portion of the initial 100 sets were sold, eliciting appreciative letters from buyers.</p>

        <h2>A Period of Dormancy and Revival</h2>
        <p>Career demands and other business ventures led to Strix being temporarily set aside. One day, David was startled to hear his wife calling him to see Strix featured on television. This chance appearance of the game on an antiques show, set in Kentwell Hall, reignited David's passion for the project, confirming that people found the game set intriguing and attractive.</p>

        <h2>Modern Renaissance</h2>
        <p>In 2019, David partnered with Sam Carter, a skilled woodworker specializing in marquetry. Sam's craftsmanship elevated Strix sets to works of art, featuring rare wood inlays and a sophisticated magnetic assembly system.</p>
        <p>Simultaneously, David began developing an online version of Strix, aiming to make the game accessible to a wider audience and provide a platform for ordering physical sets.</p>

      `,
    },
  },
  gameplay: {
    "interface-guide": {
      title: "Interface Guide",
      body: `
<h1>HOW TO PLAY STRIX USING THE ONLINE THREE-DIMENSIONAL INTERFACE</h1>

<ol>
  <li>
    <h2>The Game Board:</h2>
    <ul>
      <li>The 3D interface closely resembles a physical Strix gameset, simplified by omitting the cylindrical sockets for pieces.</li>
      <li>The gameset appears with pieces in their starting positions, set on its stand.</li>
    </ul>
  </li>

  <li>
    <h2>Board Navigation:</h2>
    <ul>
      <li>Click and drag anywhere around the gameset to rotate it in two directions.</li>
      <li>For optimal play, tilt the board towards the active player, making their face the "ground" and presenting the board as an approximate hexagon.</li>
    </ul>
  </li>

  <li>
    <h2>Making Moves:</h2>
    <ul>
      <li>To select a piece, click anywhere along its length, including the cap and shaft.</li>
      <li>Click on the destination square to complete the move. The foot of the piece will move to the selected square.</li>
    </ul>
  </li>

  <li>
    <h2>Capturing Pieces:</h2>
    <ul>
      <li>Move your piece to the appropriate square to initiate a capture.</li>
      <li>Double-click the piece to be captured to remove it from the board.</li>
      <li>For Owl captures, where the Owl replaces the captured piece, double-click the victim off the board before moving the Owl into its square.</li>
    </ul>
  </li>

  <li>
    <h2>Captured Pieces Management:</h2>
    <ul>
      <li>Captured pieces move to an invisible holding area for their team.</li>
      <li>Click anywhere on the green edging around the board to toggle visibility of the holding areas.</li>
      <li>To return a piece to its original position on the board, double-click it in the holding area.</li>
    </ul>
  </li>

  <li>
    <h2>Handling Third Bird Fouls:</h2>
    <ul>
      <li>If a Third Bird Foul occurs, click on the offending piece again.</li>
      <li>A pop-up window will appear with an option to take back the move.</li>
      <li>Selecting this option automatically returns the piece to its original position before the foul move.</li>
      <li>If the foul move involved a capture, double-click the wrongfully taken piece in the holding area to return it to its original square.</li>
    </ul>
  </li>

  <li>
    <h2>Board Visibility Options:</h2>
    <ul>
      <li>The board and fins can be toggled invisible/visible by clicking on the base.</li>
    </ul>
  </li>

  <li>
    <h2>Troubleshooting:</h2>
    <ul>
      <li>If you're having trouble selecting a piece, it may be obscured by other pieces. Try rotating the board along the other rotational axis to get a clear line of sight before attempting to click.</li>
      <li>Remember that you can click anywhere along a piece's length to select it, which can help when only part of the piece is visible.</li>
      <li>You can zoom in or out to get a better view. This is typically done using the mouse wheel or pinch gestures on touch-sensitive screens, but may vary depending on your device.</li>
    </ul>
  </li>
</ol`,
    },

    /*
    "official-rules": {
      title: "Official Rules",
      body: `
        <p>The official rules for Strix are available as a PDF document, exactly as they appear in the printed booklet included with the physical game.</p>
        <p><a href="assets/The Rules of Strix.pdf" target="_blank" class="rules-link">View Strix Rules (PDF)</a></p>
      `,
    },
    */
    "official-rules-pdf": {
      title: "Official Rules (PDF)",
      body: `
          <h2>Official Strix Rulebook</h2>
          <p>This is the official, copyrighted rulebook for Strix, identical to the printed version included with the physical game.</p>
          <p><a href="assets/The Rules of Strix.pdf" target="_blank" class="rules-link">View or Download Official Strix Rules (PDF)</a></p>
          <p><small>© 2024 David Priestley. All rights reserved.</small></p>
        `,
    },
    "online-rules-guide": {
      title: "Online Rules Guide",
      body: `
          <h2>Strix Online Rules Guide</h2>
          <p>Welcome to the web-friendly version of the Strix rules. This guide covers all aspects of gameplay and is based on the official rulebook.</p>
          
          <h3>Table of Contents</h3>
          <ul>
            <li><a href="#introduction">Section 1: Introduction</a></li>
            <li><a href="#the-game">Section 2: Game Setup</a></li>
            <li><a href="#fundamentals">Fundamentals</a></li>
            <li><a href="#moves">Moves</a></li>
             <li><a href="#pathways">Pathways</a></li>
            <!-- Add more sections as needed -->
          </ul>
    
          <section id="introduction">
        <h3>Introduction</h3>
        <img src="images/guiIntroduction.png" alt="Strix Game Board" style="max-width: 100%; height: auto; margin: 20px 0;">
        <p>STRIX is a game for three players, played in three dimensions.</p>
        <p>Inspired by the aerial agility of birds, the STRIX board and pieces represent a forest, dense but criss-crossed with sunlit glades, through which three teams of birds, each comprising an Owl, a Kite and a Raven vie to reach the Owl's nest at the centre of the board.</p>
        <p>Each player – Brown, Yellow and Green – starts the game with three pieces – an 'Owl', a 'Kite' and a 'Raven' – and aims to move the Owl to the board's centre – the 'Owl's Nest'.</p>
        <p>Simple to learn and with only three pieces for each player to control, STRIX surprises in the speed with which positions of startling tactical and diplomatic complexity arise.</p>
        <p>Does your Owl have the vision and wisdom to win?</p>
      </section>
    
         <section id="the-game">
        <h3>The Game</h3>
        <p>STRIX consists of a three-dimensional Board and three sets of three Pieces. The Board rests on a stand from which it may be removed for ease of viewing.</p>
        
        <h4>The Board</h4>
        <p>The STRIX board consists of three 7 x 7 chequer boards joined at right angles. One corner square on each face is marked with a coloured circle – brown on Brown's starting face, yellow on Yellow's, and green on Green's. These are the Owl Squares; they mark the positions of the three Owls when a game begins. The faces and Owl Squares are shown in Figure 1.</p>
        <p>In the physical version of the game, the squares have sockets to receive the feet of the pieces.</p>
        
        <figure>
          <img src="images/guiBoardFig1.png" alt="Strix Game Board" style="max-width: 100%; height: auto;">
          <figcaption>Figure 1: The Strix game board showing the three faces and Owl Squares</figcaption>
        </figure>
        
        <h4>The Pieces</h4>
        <p>Each player – Brown, Yellow and Green – has three pieces: an Owl, a Kite and a Raven. These are distinguished by their coloured bodies: an Owl's body is a tawny brown; a Kite's is red and a Raven's black. Pieces' heads reflect their team colours – Brown, Yellow or Green. Pieces stand head outward, with their feet pressed into the sockets in the board. Figure 2 shows a complete set of Strix pieces, arranged into their teams. (Note: this is not the starting position.)</p>
        
        <figure>
          <img src="images/guiPiecesFig2.png" alt="Strix Game Pieces" style="max-width: 100%; height: auto;">
          <figcaption>Figure 2: A complete set of Strix pieces arranged by team</figcaption>
        </figure>
      </section> 

        <section id="fundamentals">
        <h3>Fundamentals</h3>
        <p>IN THE FOLLOWING RULES, "STANDARD STRIX" REFERS TO THE RECOMMENDED VERSION OF THE GAME FOR NORMAL PLAY.</p>

        <h4>Rule 1: The Object of the Game</h4>
        <p>A player wins by moving his or her Owl, the chief piece of the team, into any of the three central black squares that make up the Nest (marked in purple in Figure 3). The game ends when one of the following occurs:</p>
        <ul>
          <li>An Owl reaches the Nest.</li>
          <li>Only one Owl is left standing on the board.</li>
          <li>A draw or stalemate is declared (as defined later in these Rules).</li>
        </ul>

        <figure>
          <img src="images/guiNestFig3.png" alt="Strix Game Board showing the Nest" style="max-width: 100%; height: auto;">
          <figcaption>Figure 3: The Strix game board showing the Nest (purple squares)</figcaption>
        </figure>

        <h4>Rule 2: Starting Position</h4>
        <p>Each player starts the game with all three pieces on his or her own Starting Face (as designated by the colour of its Owl Square). The Owl starts in the Owl Square, the Kite in the black square diagonally adjacent to it, and the Raven one square on along the same diagonal. The set-up is shown in Figure 4</p>

        <figure>
          <img src="images/guiStartingPositionFig4.png" alt="Strix Starting Position" style="max-width: 100%; height: auto;">
          <figcaption>Figure 4: The starting position in Strix</figcaption>
        </figure>

        <h4>Rule 3: Order of Play</h4>
        <p>The order of play is as follows: Brown, Yellow, Green, Brown, Yellow, Green, and so on.</p>
      </section>

       <section id="moves">
        <h3>Moves</h3>
        <p>A player's turn consists in moving one of his or her pieces to a new square on any of the Board's three faces. All pieces travel orthogonally (i.e. like Rooks in Chess); their different powers are explained in detail later. The following two rules set limits on where a moving piece can stop.</p>

        <h4>Rule 4: The Nest</h4>
        <p>Only an Owl can stop in the Nest, in the act of ending the game. As a result, Owls never need to pass through the Nest, but Kites and Ravens may pass through it on their way to other squares.</p>

        <h4>Rule 5: Shadowing – The Fundamental Rule of Strix</h4>
        <p>Pieces must be able to stand freely upright in their squares.</p>
        <p>This fundamental rule means that for every piece standing on a particular face there is a row of unavailable squares on each of the other faces. These squares are said to be "SHADOWED".</p>
        <p>Figure 5 shows the shadowed squares for Yellow's Owl shaded in blue. With respect to a piece wishing to cross a row of shadowed squares, like those in Figure 5, Yellow's Owl is called a "CROSSPIECE".</p>

        <figure>
          <img src="images/guiShadowedRowsFig5.png" alt="Strix Board showing shadowed squares" style="max-width: 100%; height: auto;">
          <figcaption>Figure 5: Shadowed squares (blue) created by Yellow's Owl (crosspiece)</figcaption>
        </figure>
      </section>

       <section id="pathways">
        <h3>Pathways</h3>
        <p>Like Rooks in Chess, all pieces in Strix can move orthogonally; their feet follow orthogonal paths across the board. They may follow paths onto a new face. Figure 6 shows the paths radiating from a typical square for a Raven (shown) or a Kite. Owls (see Rule 7 below) follow the same paths but may only move one square at a time.</p>

        <figure>
          <img src="images/guiPathwaysFig6.png" alt="Strix Board showing pathways for Raven or Kite" style="max-width: 100%; height: auto;">
          <figcaption>Figure 6: Pathways for a Raven or Kite from a typical square</figcaption>
        </figure>

        <h4>Rule 6: Kites' and Ravens' Moves</h4>
        <p>Kites and Ravens may travel orthogonally through any number of unoccupied squares.</p>
        <p>They cannot cross squares other pieces are standing on. However, they can cross squares other pieces are merely 'shadowing'. In other words, Kites and Ravens can pass through crosspieces.</p>
        <p>In the position shown in Figure 7, from Green's Kite's perspective, Yellow's Owl is a crosspiece through which it may pass.</p>
        <p>In Figure 7, Green's Kite can reach Brown's Owl Square (marked with the brown circle, next to where Brown's Owl is actually standing), even though its path (shown in turquoise) crosses the line of squares shadowed by Yellow's Owl (shown as the deeper blue squares). However, Brown's Raven cannot reach Brown's Owl Square, as its path (also shown in turquoise) is blocked by the foot of Brown's Owl.</p>

        <figure>
          <img src="images/guiKiteAndRavenMovesFig7.png" alt="Strix Board showing Kite and Raven moves" style="max-width: 100%; height: auto;">
          <figcaption>Figure 7: Kite and Raven moves, demonstrating passing through a crosspiece</figcaption>
        </figure>

        <h4>Rule 7: Owls' Moves (i)</h4>
        <p>In general, an Owl moves one square at a time orthogonally. As shown in Fig.8, an Owl could move to any of the four orthogonally adjacent squares. Note that, because the Owl is standing adjacent to another face, one of the adjacent squares is located on the second face. To reach this square, the Owl must move "around the corner" onto that face.</p>

        <figure>
          <img src="images/guiOwlsMovesFig8.png" alt="Strix Board showing Owl moves" style="max-width: 100%; height: auto;">
          <figcaption>Figure 8: Possible moves for an Owl</figcaption>
        </figure>

        <h4>Rule 8: Owls' Moves (ii) - Ghosting</h4>
        <p>Instead of moving to an adjacent square, an Owl, as if flying silently through the trees, may be able to 'GHOST' onto one of the other two faces of the board.</p>
        <p>To ghost, the Owl must first be standing next to a crosspiece (Owl, Kite or Raven, from any team) so that their shafts almost touch but are at right angles, as in Figure 9a. When in this position, the pieces are described as being "CROSS-ADJACENT".</p>
        <p>Using this crosspiece as a sort of axle, the Owl pivots so that it ends up at right angles to its original position, still cross-adjacent to the crosspiece, with its foot on a square on the adjacent face next to the row of squares shadowed by the crosspiece. The Owl's foot must travel through unoccupied squares.</p>
        <p>Figure 9b shows the final position.</p>

        <figure>
        <img src="images/guiOwlGhostingFig9a.png" alt="Strix Board showing position before outward ghosting" style="max-width: 100%; height: auto;">
        <figcaption>Figure 9a: Position before Yellow's Owl ghosts outward around Brown's Raven</figcaption>
        </figure>

        <figure>
        <img src="images/guiOwlGhostingFig9b.png" alt="Strix Board showing position after outward ghosting" style="max-width: 100%; height: auto;">
        <figcaption>Figure 9b: Position after Yellow's Owl has ghosted outward around Brown's Raven</figcaption>
        </figure>

        <p>Figures 9a and 9b show the before and after positions of Yellow's Owl ghosting around Brown's Raven. The rows of squares shadowed by the Raven are shaded in blue, and the target position of Yellow's Owl is marked in bright green.</p>
        <p>In Figures 9a and 9b, the Owl ghosts "outwards", meaning that it moves from in between the pair of shadowed rows of squares to a square outside them.</p>

        <p>An Owl may also – in fact, a more common move - ghost "inwards".</p>

        <figure>
        <img src="images/guiOwlGhostingFig10a.png" alt="Strix Board showing position before inward ghosting" style="max-width: 100%; height: auto;">
        <figcaption>Figure 10a: Position before Yellow's Owl ghosts inward around Brown's Raven</figcaption>
        </figure>

        <figure>
        <img src="images/guiOwlGhostingFig10b.png" alt="Strix Board showing position after inward ghosting" style="max-width: 100%; height: auto;">
        <figcaption>Figure 10b: Position after Yellow's Owl has ghosted inward around Brown's Raven</figcaption>
        </figure>

        <p>Figures 10a and 10b show the before and after positions of Yellow's Owl ghosting "inwards" around Brown's Raven. Note that the Owl moves from outside the pair of shadowed rows of squares to a square between them.</p>

        <p>Inward ghosting is one of the most direct ways for Owls to reach the Nest.</p>
      </section>

    
          <!-- Add more sections as needed -->
    
          <p><small>This online guide is based on the official Strix rulebook. © 2024 David Priestley. All rights reserved.</small></p>
        `,
    },
    "board-notation": {
      title: "Board Notation",
      body: `<h1>STRIX NOTATION</h1>

<p>This section explains how to record moves and positions in STRIX.</p>

<h2>PIECES:</h2>
<p>Pieces are denoted by their initial letters: O for Owl, K for Kite, and R for Raven. These letters are written as capitals. To specify which team a piece belongs to, precede the capital letter with a lowercase b (for Brown), y (for Yellow) or g (for Green). For example, 'gK' means 'Green's Kite'.</p>

<h2>SQUARES:</h2>
<p>Squares are identified by a lowercase letter (b, y, or g) followed by two numbers.</p>
<ul>
    <li>The letter indicates the starting face the square is on (b for Brown's, y for Yellow's, g for Green's).</li>
    <li>The numbers provide the square's 'grid reference' on that face:
        <ol>
            <li>The first number gives the square's distance from the face's 'lefthand' outside edge (opposite the Owl Square).</li>
            <li>The second number gives its distance from the face's 'righthand' outside edge (touching the Owl Square).</li>
        </ol>
    </li>
</ul>
<p>Example: Yellow's Owl Square would be 'y71': it's on Yellow's starting face, in the seventh row from the lefthand edge, and in the first row from the righthand edge.</p>

<figure>
    <img src="images/BoardNotation.png" alt="Diagram showing square numbering on Yellow's face" />
    <figcaption>The diagram shows how squares would be numbered on a typical face (Yellow's in this case). The Nest is at the bottom of the picture and the Owl Square on the left.</figcaption>
</figure

<h2>RECORDING MOVES:</h2>
<p>A move is recorded by identifying:</p>
<ul>
    <li>The piece being moved</li>
    <li>The square it moves to</li>
</ul>
<p>Example: If Brown's Owl moves one square towards the Nest from its Owl Square, we record it as "bO-b72".</p>

<h3>Additional Symbols:</h3>
<ul>
    <li>'x' indicates capturing (e.g., "bO x yK" means Brown's Owl captures Yellow's Kite)</li>
    <li>'?' indicates a questionable move</li>
    <li>'!' indicates a good move</li>
</ul>`,
    },

    "sample-games": {
      title: "Sample Games",
      body: `
         <div class="sample-game">
          <h2>SAMPLE GAME 1</h2>
          <p>Sample Game 1. Played under Standard Strix rules.</p>
          <h3>Notation:</h3>
          <ul>
            <li>[Player][Piece]-[Destination Square]</li>
            <li>Players: b = Brown, y = Yellow, g = Green</li>
            <li>Pieces: O = Owl, K = Kite, R = Raven</li>
          </ul>
          <div class="game-moves">
<p><strong>1.1 bR-y31 </strong> This prevents 1.2. yK &ndash; g25, making a pivot for yO to ghost around, as 2.1 bR-y51 would mob yK from the board.</p>
<p><strong>1.2 yR-g31 </strong> Yellow deploys the same opening move, with similar thinking, but with respect to Green.</p>
<p><strong>1.3 gR-b31 </strong>For Green the move is less powerful, as the threat of mobbing the succeeding player&rsquo;s Kite in the same way as Brown and Yellow did is no longer available. However, it does prevent Brown&rsquo;s Owl heading for the nest with 2.1 bO&ndash;b72. This opening type is called &ldquo;All Ravens to the Forest Edge&rdquo;.</p>
<br>
<p><strong>2.1 bR-y32 </strong>Brown wishes to dislodge gR, but to do so would entail a two-move operation with bK, moving bK first to a square on Yellow&rsquo;s face and then back to b32. However, moving bK from its position would allow 2.2 yK-g26, giving sight of the nest to Yellow&rsquo;s Owl. To forestall this, Brown moves bR one square to block yK.</p>
<p><strong>2.2 yR-g32 </strong>Although there is no immediate cause for moving to this square, Yellow deems it prudent for yR to be blocking any future move by gK to b26, which would give nest sight to gO. ,</p>
<p><strong>2.3 gO-g72 </strong>Green anticipates 3.3 gR-b35, providing an axle for gO to ghost around. This might appear dangerous, as gR-b35 would leave gR en prise from yR, but Green calculates that Yellow will have more things to worry about by then.</p>
<br>
<p><strong>3.1 bR-b13! </strong>Brown spots that moving his Raven to this square will give him a choice of mobbing gO or gK, nudging Green to move his Raven away from its threatening position.</p>
<p><strong>3.2 yK-g25? </strong>Yellow makes its move, calculating that the head start it will gain by this will offset the probable loss of its Raven by 3.3 gR-b33xyR. A risky move.</p>
<p><strong>3.3 gR-b33 </strong>xyR As predicted, Green takes Yellow&rsquo;s Raven. Green notes that Brown can stop Yellow reaching the Nest by first making a pivot with 4.1 bK-y25 and then ghosting inwards, interposing Brown&rsquo;s Owl between Yellow&rsquo;s Owl and the nest. This absolves Green of the obligation to block Yellow&rsquo;s approach to the nest.</p>
<br>
<p><strong>4.1 bK-y25 </strong>The move is forced, anticipating 4.2 bO-g67. There is no other way to block Yellow gaining the nest. This puts bK en prise to gK on Green&rsquo;s next move, but Green cannot in fact take bK as it would allow bO to ghost into the nest- or would constitute a Third Bird Foul if Yellow called it out.</p>
<p><strong>4.2 yO-b67 </strong>Yellow has sight of the nest.</p>
<p><strong>4.3 gR-b35 </strong>Green cannot stop Yellow but sees that Brown must stop Yellow&rsquo;s move into the nest, so takes advantage by making a pivot for his Owl.</p>
<br>
<p><strong>5.1 bO-g67 </strong>Brown&rsquo;s Owl ghosts into this square, blocking yO and gaining sight of the nest.</p>
<p><strong>5.2 yK- g45 </strong>Yellow cannot stop bO so leaves it to Green. In the meantime, Yellow decides to cause as much damage as possible, attacking bK.</p>
<p><strong>5.3 gO-y27 </strong>Green has two ghosting options, inwards and outwards. The former leads to an immediate victory by Brown. This second, less obvious option keeps bO away from the nest without the risk of it ghosting into the nest.</p>
<br>
<p><strong>6.1 (a) bK-g55xyK? </strong>It looks like Yellow miscalculated, losing yK; but Brown did not notice that with gO ghosted away, Yellow can ghost to victory. Green calls a Third Bird Foul on Brown for letting Yellow win. It is a straightforward blunder and is acknowledged by all. Brown undoes the last move, using one of the allocated takebacks.</p>
<p><strong>6.1 (b) bR-b17 </strong>This blocks yO&rsquo;s ghost into the nest.</p>
<p><strong>6.2 yK-b53 </strong>Yellow could take Brown&rsquo;s Kite, heaping further punishment on Brown for the foul of Preparation, but decides to attack gO, thinking that after gO moves, Yellow will still be able to take bK, and from a better square, that will also threaten bO the move after.</p>
<p><strong>6.3 gK-b23 </strong>Green must defend the Owl from yK and the Kite from bR; this move accomplishes both.</p>
<br>
<p><strong>7.1 </strong>bK-y65 Brown moves the Kite out of danger from yK and threatens yO.</p>
<p><strong>7.2 yK-b51 </strong>Yellow cannot defend the Owl, so threatens gO, hoping that Brown &ndash; for some reason - will not take yO on Brown&rsquo;s next turn.</p>
<p><strong>7.3 gK-b21 </strong>Green must defend the Owl but cannot move or bO will walk into the Nest. This is the only option.</p>
<br>
<p><strong>8.1 bK-b66 x yO </strong>Brown takes Yellow&rsquo;s Owl. Yellow&rsquo;s Kite can no longer make moves.</p>
<p><strong> 8.2 gR-b36 </strong>Green would like to make a pivot, but more urgently must stop Brown doing the same.</p>
<br>
<p><strong> 9.1 bR-b16 </strong>Brown wants to give the Owl two ways to enter the Nest, and still has eyes for gO.</p>
<p><strong> 9.2 gR-b37 </strong>Green sees the most immediate threat is bO-y76 and blocks it.</p>
<br>
<p><stong> 10.1 bK-b65 </strong>Brown must get the Kite and Raven on different files, to be able to make a pivot.</p>
<p><strong> 10.2 gO-y37 </strong>Green can see no good move with the Kite, so moves the Owl to safety.</p>
<br>
<p><strong> 11.1 bR-y67 </strong>Brown is making a pivot for the Owl.</p>
<p><strong> 11.2 gR-y73 </strong>Green&rsquo;s Raven blocks bO&rsquo;s ghosting into the Nest.</p>
<br>
<p><strong> 12.1 bO-y76 </strong>Brown&rsquo;s Owl is one away from the Nest.</p>
<p><strong> 12.2 gR-y72 </strong>Green affords Brown the courtesy of gaining the Nest, rather than resigning.</p>
<br>
<p><strong>13.1 bO-y77 </strong>Brown moves into the Nest and Wins.</p>
</div>
</div>
`,
    },

    "two-player-variant": {
      title: "Two-Player Strix",
      body: `
        <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;line-height:115%;font-size:16px;font-family:"Aptos",sans-serif;'><strong><span style="font-size:13px;line-height:115%;">TWO PLAYER STRIX&nbsp;</span></strong></p>
        <p style='margin-right:0cm;margin-left:0cm;font-size:16px;font-family:"Times New Roman",serif;'>TWO-PLAYER STRIX</p>
        <p style='margin-right:0cm;margin-left:0cm;font-size:16px;font-family:"Times New Roman",serif;'>STRIX was conceived and is best played as a game for three players. However, several two-player variants of the game exist. The following describes the variant that most closely approximates the three-player game:</p>
        <p style='margin-right:0cm;margin-left:0cm;font-size:16px;font-family:"Times New Roman",serif;'>Starting Position and Basic Rules:</p>
        <ul style="list-style-type: disc;margin-left:26px;">
            <li>The starting position is the same as for three-player STRIX.</li>
            <li>The powers of the pieces, the object of the game, and the rules for the Nest and blocking remain unchanged.</li>
        </ul>
        <p style='margin-right:0cm;margin-left:0cm;font-size:16px;font-family:"Times New Roman",serif;'>New Restrictions:</p>
        <div style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;line-height:115%;font-size:16px;font-family:"Aptos",sans-serif;'>
            <ul style="margin-bottom:0cm;list-style-type: disc;margin-left:26px;">
                <li style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;line-height:115%;font-size:16px;font-family:"Aptos",sans-serif;'>Green's Owl – since Green is not an active player - may not be moved into the Nest.</li>
            </ul>
        </div>
        <p style='margin-right:0cm;margin-left:0cm;font-size:16px;font-family:"Times New Roman",serif;'>Gameplay:</p>
        <ul style="list-style-type: disc;margin-left:26px;">
            <li>Brown and Yellow move alternately, with Brown playing first.</li>
            <li>A player can move any of their own pieces or choose to move one of Green's pieces.</li>
            <li>Green's pieces are treated as common property.</li>
            <li>If a player moves one of Green's pieces, that specific piece becomes unavailable for both players on their next turns.</li>
        </ul>
        <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;line-height:115%;font-size:16px;font-family:"Aptos",sans-serif;'><strong><span style="font-size:13px;line-height:115%;">&nbsp;</span></strong></p>
      `,
    },
  },

  quill: {
    "strix-lore": {
      title: "Strix Lore",
      body: quillSection.renderStrixLore(),
      onRender: () =>
        quillSection.initializeCollapsibles(".strix-lore-section"),
    },
    parliament: {
      title: "Parliament",
      body: quillSection.renderParliament(),
      onRender: () =>
        quillSection.initializeCollapsibles(".parliament-section"),
    },
  },
  gallery: {
    "strix-sightings": {
      title: "Sightings of Strix",
      body: `
        <p>Strix in a medieval study</p>
          <a href="images/StrixInSolarUnsaturated.jpg" class="lightbox-image">
          <img src="images/StrixInSolarUnsaturated.jpg" alt="Strix in Solar" style="max-width: 100%; height: auto; margin-top: 15px;">
         </a>
        <p></p>
        `,
    },
  },

  shop: {
    purchase: {
      title: "Order Game Sets",
      body: "Strix game sets are currently in limited production. Each set includes a handcrafted 3D board, 9 beautifully designed pieces (3 each of Owls, Kites, and Ravens), and a comprehensive rulebook. Sets are available in classic wood or a modern acrylic version. Pre-order now to reserve your copy of this unique strategy game!",
    },
  },
};
