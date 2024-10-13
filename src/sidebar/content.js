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
            <li><a href="#taking">Taking</a></li>
            <li><a href="#third-bird-foul">Third Bird Foul</a></li>
            <li><a href="#further-rules">Further Rules</a></li>
            <li><a href="#additional-considerations">Additional Considerations</a></li>
            <li><a href="#final-word">A Final Word</a></li>
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

       <section id="taking">
        <h3>Taking</h3>
        <p>All pieces can capture others, and all pieces – including Owls – can be captured. When a piece is captured, it is removed from the board and plays no further part in the game, unless reinstated as part of a take-back (see Rule 17 (iii)).</p>

        <h4>Rule 9: How Owls Capture</h4>
        <p>Owls capture by moving into a victim's square. In practice this means an Owl can only capture a piece standing next to it; the geometry of the board stops Owls from taking by Ghosting or from face to face.</p>
        <p>In Figure 11, Brown's Owl could capture Yellow's, and vice versa.</p>
        <p>Note that Yellow's Owl, standing on a black square, is only vulnerable to attacks by other Owls, as explained in Rule 15.</p>

        <figure>
          <img src="images/guiOwlsCaptureFig11.png" alt="Strix Board showing Owl capture" style="max-width: 100%; height: auto;">
          <figcaption>Figure 11: Owl capture possibilities</figcaption>
        </figure>

        <h4>Rule 10: How Kites Capture</h4>
        <p>Following real kites, the Kites in STRIX capture by 'SWOOPING'. The Kite descends from one board face to another, landing beside the victim and snatching it. After the capture is completed the Kite remains where it landed, beside the now vacant square. Kites may only capture pieces on faces other than the one from which they launched their attack.</p>
        <p>In Figure 12a, Green's Kite has a choice of capturing Brown's or Yellow's Raven by landing on one of the squares marked in bright green.</p>

        <figure>
          <img src="images/guiKiteCaptureFig12a.png" alt="Strix Board showing Kite capture options" style="max-width: 100%; height: auto;">
          <figcaption>Figure 12a: Kite capture options</figcaption>
        </figure>

        <p>In Figure 12b, Green's Kite has made its choice and has captured Yellow's Raven. Note that the Kite remains where it "landed" and does not occupy the Raven's former square.</p>

        <figure>
          <img src="images/guiKiteCaptureFig12b.png" alt="Strix Board showing completed Kite capture" style="max-width: 100%; height: auto;">
          <figcaption>Figure 12b: Completed Kite capture</figcaption>
        </figure>

        <h4>Rule 11: Kites' Choice of Capture</h4>
        <p>Sometimes a Kite moves so that it lands between two opponent pieces. In this case, the Kite can choose which of the pieces to capture but cannot capture both. In Figure 13, Green's Kite can choose whether to capture Brown's Kite or Yellow's Raven.</p>

        <figure>
          <img src="images/guiKitesChoiceOfCaptureFig13.png" alt="Strix Board showing Kite's choice of capture" style="max-width: 100%; height: auto;">
          <figcaption>Figure 13: Kite's choice of capture</figcaption>
        </figure>

        <h4>Rule 12: How Ravens Capture</h4>
        <p>Ravens capture in pairs, by 'MOBBING' another piece: they must sandwich it between them in the way shown in Figures 14 a-c. Ravens cannot Mob a piece on the same face as themselves. They must be parallel to each other and cross-adjacent to their victim, on opposite sides of a square shadowed by it.</p>
        <p>A Raven cannot capture single-handedly. It must have the passive aid of a second Raven already standing cross-adjacent to the piece under attack. To capture the piece, the attacking Raven also moves cross-adjacent to it, directly across it from the passive Raven.</p>
        <p>In Figure 14a, if Brown's Raven moves to the square marked in bright green, it can enlist the support of Green's Raven to mob Yellow's Kite.</p>

        <figure>
          <img src="images/guiRavensCaptureFig14a.png" alt="Strix Board showing Raven mobbing setup" style="max-width: 100%; height: auto;">
          <figcaption>Figure 14a: Raven mobbing setup</figcaption>
        </figure>

        <p>Figure 14b shows the intermediate position, as the two Ravens trap the Kite between them, like pincers.</p>

        <figure>
          <img src="images/guiRavensCaptureFig14b.png" alt="Strix Board showing Raven mobbing in progress" style="max-width: 100%; height: auto;">
          <figcaption>Figure 14b: Raven mobbing in progress</figcaption>
        </figure>

        <p>Figure 14c shows the position at the end of Brown's Raven's move, with Yellow's Kite removed from the board.</p>

        <figure>
          <img src="images/guiRavensCaptureFig14c.png" alt="Strix Board showing completed Raven mobbing" style="max-width: 100%; height: auto;">
          <figcaption>Figure 14c: Completed Raven mobbing</figcaption>
        </figure>

        <p>Note that any Raven can play the passive role in Mobbing, even one belonging to the victim's team or one which is no longer active, its Owl having been captured earlier in the game (see Rule 16).</p>

        <h4>Rule 13: Attacker's Choice in Mobbing</h4>
        <p>An attacking Raven that finds itself mobbing multiple pieces at once may capture as many of them as it chooses: all, some or none. The same principle applies when only one piece is being mobbed: the attacking Raven can choose whether or not to capture it.</p>

        <h4>Rule 14: Stopping Between Two Ravens</h4>
        <p>Mobbing captures occur when a Raven arrives in the square opposite its partner. If the Ravens are in place already, a piece that stops in a mobbed position is not committing suicide; capturing it would require a separate act of mobbing by the Ravens.</p>

        <h4>Rule 15: Owls' Safety on Black Squares</h4>
        <p>Just as at night the owl reigns supreme and is invulnerable to attacks from other birds, in STRIX, when an Owl is standing on a black square, it cannot be taken by a Kite or mobbed by Ravens. It can, however, be captured by another Owl.</p>

        <h4>Rule 16: When Owls are Captured</h4>
        <p>When a player's Owl is captured, it is removed from play. Without the Owl, the team's chief piece, that player may take no further moves.</p>
        <p>In all other ways, the game continues as before. The Owl-less player's remaining pieces stay on the board as debris, paralysed, but blocking or facilitating the remaining players' moves as normal. Paralysed pieces can still be captured or used passively for ghosting or (in a Raven's case) mobbing. The two survivors continue to fight on, making moves alternately.</p>
        <p>If two players have lost their Owls and have dropped out, the game ends with the surviving Owl's team victorious.</p>
      </section>

        <section id="third-bird-foul">
        <h3>Third Bird Foul</h3>

        <h4>Rule 17: "Third Bird Foul"</h4>
        <p>A "Third Bird Foul" occurs when a player makes a move that unintentionally allows another player to win within a pre-determined number of turns (the "Thicket"), while the third player ("the Third Bird") is left helpless to prevent the impending victory, despite the existence of an alternative move that would not have led to this outcome.</p>
        <p>The Third Bird Foul is an integral part of the game of Strix. This unique rule adds depth to strategic planning, encourages vigilant gameplay, and promotes balance among all three players. It transforms Strix from a mere race to the Nest into a complex dance of moves and countermoves, where players must constantly consider the implications of their actions on all opponents.</p>
        <p>An example is the best way to understand the circumstance when a Third Bird foul arises.</p>

        <p>Figures 15a, 15b and 15c show a typical example of a Third Bird Foul in progress.</p>

        <figure>
          <img src="images/guiThirdBirdFoulFig15a.png" alt="Third Bird Foul Example - Initial Position" style="max-width: 100%; height: auto;">
          <figcaption>Figure 15a: Initial position before Third Bird Foul</figcaption>
        </figure>

        <p>In Figure 15a, Brown (to move), having failed to notice that Green's Owl, by its previous move, has opened a path for Yellow's Owl to ghost into the nest, determines to capture Yellow's Kite with the Brown Kite.</p>

        <figure>
          <img src="images/guiThirdBirdFoulFig15b.png" alt="Third Bird Foul Example - After Brown's Move" style="max-width: 100%; height: auto;">
          <figcaption>Figure 15b: Situation after Brown's capture of Yellow's Kite</figcaption>
        </figure>

        <p>Figure 15b shows the situation after Brown's capture of Yellow's Kite.</p>

        <p>Green, seeing that Yellow's Owl has only to ghost around Brown's Owl to gain the Nest, and win, calls "Third Bird Foul!"</p>

        <figure>
          <img src="images/guiThirdBirdFoulFig15c.png" alt="Third Bird Foul Example - After Resolution" style="max-width: 100%; height: auto;">
          <figcaption>Figure 15c: Aftermath of the Third Bird Foul</figcaption>
        </figure>

        <p>Figure 15c shows the aftermath of the Third Bird Foul. Brown's foul move has been retracted, replacing Yellow's Kite and returning the Brown Kite to its original square. A replacement move has been made, placing the Brown Raven in a square that prevents Yellow's Owl from ghosting into the Nest.</p>
        <p>If Brown has takebacks remaining, Brown makes this replacement move. However, if Brown has no takebacks left, Brown is eliminated from the game. In this case, Green, who called the Foul, makes the replacement move on behalf of the now-eliminated Brown.</p>

        <p>The sub-rules of Rule 17 dealing with this important part of the game are grouped under the following headings:</p>
        <ul>
          <li>Basics (i-iii)</li>
          <li>Resolution (iv-v)</li>
          <li>Special Cases (vi-xi)</li>
        </ul>

        <h5>Rule 17 (i): Thicket Depth</h5>
        <p>Before the game begins, players must agree on the "Thicket" depth – the number of complete turns (cycles of moves by all players) from the current player's move within which a potential Third Bird Foul can be identified. The recommended Thicket depth for each version of Strix is as follows:</p>
        <ul>
          <li>Simple STRIX: 1 turn (the next player's move and the third player's move)</li>
          <li>Standard STRIX: 2 turns (the next two players' moves, the current player's next move, and the next two players' moves again)</li>
          <li>Advanced STRIX: 3 turns</li>
        </ul>

        <h5>Rule 17 (ii): Move Confirmation</h5>
        <p>After making a move, the active player shall invite the player on their left (the preceding player in turn order) to examine the new board position.</p>
        <p>The preceding player shall then either: a) Accept the move by saying "Move confirmed" or a similar phrase, or b) Call "Third Bird Foul" if they believe one has occurred.</p>
        <p>The move is not considered complete, and the following player may not begin their turn, until this confirmation or foul call has been made.</p>
        <p>Players may agree on a reasonable time limit for the preceding player to confirm or call a foul.</p>

        <h5>Rule 17 (iii): Calling and Demonstrating a Foul</h5>
        <p>Both the preceding player and the following player have the right to call a Third Bird Foul.</p>
        <p>The preceding player must call the foul during the move confirmation process (see Rule 17(ii)).</p>
        <p>The following player must call the foul before making their own move.</p>
        <p>When a Third Bird Foul is called, the caller must demonstrate the sequence of moves leading to the other player's inevitable victory within the Thicket depth.</p>

        <h5>Rule 17 (iv): Takebacks</h5>
        <p>Each player has a limited number of "take-backs" to retract and replay a move that would lead to a Third Bird Foul within the Thicket depth. The number of takebacks depends on the game version:</p>
        <ul>
          <li>Simple STRIX: 3 takebacks per player</li>
          <li>Standard STRIX: 2 takebacks per player</li>
          <li>Advanced STRIX: 1 takeback per player</li>
        </ul>

        <h5>Rule 17 (v): Resolving the Foul</h5>
        <p>If the player who committed the foul has takebacks remaining, they must use one to retract and replay their move. If they have no takebacks left:</p>
        <ul>
          <li>The player is eliminated from the game.</li>
          <li>The player's move that occasioned the foul is retracted.</li>
          <li>The player who successfully called the foul makes an alternative legal move on behalf of their behalf.</li>
          <li>The game continues with the remaining two players.</li>
        </ul>

        <h5>Rule 17 (vi): Self-Preservation Not Sufficient Justification</h5>
        <p>Self-preservation does not justify committing a Third Bird Foul. Players may need to sacrifice their Owl to avoid committing this foul.</p>

        <h5>Rule 17 (vii): Taking the Caller's Owl</h5>
        <p>Third Bird Foul rules apply even when the move in question captures the Owl of the player calling the foul.</p>

        <h5>Rule 17 (viii): Only One Act of Calling</h5>
        <p>Only one Third Bird Foul call can be considered at a time. Players cannot call a Third Bird Foul based on a scenario that includes an earlier, successful foul call and its resulting takeback.</p>

        <h5>Rule 17 (ix): False or Mistaken Calling of the Foul</h5>
        <p>If a player calls a Third Bird Foul that, upon analysis, proves to be baseless:</p>
        <ul>
          <li>If the caller has takebacks remaining, they lose one takeback.</li>
          <li>If the caller has no takebacks remaining:
            <ol type="a">
              <li>The false caller is eliminated from the game (loses).</li>
              <li>The original move stands, and the game continues with the remaining two players.</li>
            </ol>
          </li>
        </ul>

        <h5>Rule 17 (x): Takeback and Replay Considered One Move</h5>
        <p>When counting game moves, a takeback due to a successful Third Bird Foul call cancels out the original move. The replacement move takes its place in the move sequence.</p>

        <h5>Rule 17 (xi): Unavoidable Foul</h5>
        <p>If a player faces a situation where any move (including not moving, see Rule 18) would result in a Third Bird Foul:</p>
        <ul>
          <li>That player loses the game.</li>
          <li>The remaining two players continue play.</li>
        </ul>
      </section>

       <section id="further-rules">
        <h3>Further Rules</h3>

        <h4>Rule 18: Stalemate</h4>
        <p>A situation may arise in STRIX when all of one player's pieces are blocked, making any move impossible. In this case, the game is declared to be draw: a three-way draw if three players are still at the board; or a two-way draw if only two remain.</p>
        <p>The exception to this (see Rule 17(xi)) is if the player's inability to make a move brings about a situation resulting in a Third Bird Foul, in which case the player loses the game and the remaining players continue.</p>

        <h4>Rule 19: Resignation</h4>
        <p>When all three players are still active, a player wishing to resign should give a round's notice. In other words, they should announce that their current move is their penultimate one. The pieces belonging to the resigned player remain on the board.</p>
        <p>In a situation where a player's position appears hopeless – for example, if avoidance of a Third Bird Foul means that the player's Owl is left <em>en prise</em> – etiquette requires that the player move as if the <em>coup de grâce</em> might not fall (as indeed it might not, depending on the tactical thinking of the other players).</p>
        <p>If victory is inevitable for one player and no Third Bird Foul is detected, the two remaining players may jointly resign.</p>
        <p>If a player has been eliminated already and one of the remaining two players finds his or her position hopeless, he or she may resign at any point.</p>

        <h4>Rule 20: Repeated Moves</h4>
        <p>Sometimes a situation arises where it is to the benefit of no player to deviate from a repeated set of moves. If the same series of moves is repeated three times, a draw is declared, meaning that the game has no winner or loser. This applies if there three players or two players at the time when the repetitions begin.</p>

        <h4>Rule 21: Drawn Games</h4>
        <p>In Standard STRIX, there are two types of drawn games.</p>
        <p>The first is the "THREE-WAY DRAW". This occurs with three rounds of repeated moves by agreement of all three players.</p>
        <p>The second is the "TWO-WAY DRAW". This can occur when one player has been eliminated and the remaining two players agree that neither is going to win.</p>

        <h4>Rule 22: Winning</h4>
        <p>The winner is the player whose team's Owl reaches the Nest first, or who has the last Owl standing on the board.</p>
      </section>

       <section id="additional-considerations">
        <h3>Additional Considerations</h3>

        <h4>Tourneys</h4>
        <p>For players intending to play more than a single game of STRIX, it is recommended that they play a 'TOURNEY' of three games. In a Tourney, each player takes his or her turn at each of the team colours. If the physical game is being played, Initial selection for the first game can be made be one player (or a referee) holding three Owls in a bunch so that the coloured tops cannot be seen and then asking the players to pick one each. The team colours taken in the subsequent two games follow the standard order: brown, yellow, green.</p>
        <p>For three players of markedly unequal experience, it may be preferred to play a "DOUBLE TOURNEY". In a Double Tourney, the players play one Tourney as above, and then a second with two players' positions reversed (for example, Brown may swap seats with Yellow). This ensures that no player always follows the weakest player.</p>

        <h4>Collaboration</h4>
        <p>There is nothing in the rules of STRIX to forbid collaboration between players. However, all offers of collaboration should be made exclusively through moves in the game and not verbally or by prior arrangement.</p>
      </section>
      
       <section id="final-word">
        <h3>A Final Word</h3>

        <p>STRIX is a new game, born from a passion for strategic thinking. While every effort has been made to foresee unusual situations and draft comprehensive rules, the true nature of STRIX will only unfold as it is played and explored.</p>

        <p>As with any complex game, STRIX may reveal unforeseen scenarios or strategic nuances that require further clarification or additional rules. We believe this is not a flaw, but a testament to the game's depth and potential for growth. We anticipate and welcome the need for future addenda, viewing them as a natural part of STRIX's evolution.</p>

        <p>We invite you, the players, to be part of this journey. Your experiences, questions, and insights will be invaluable in shaping the future of STRIX. Feel free to share your thoughts and discoveries with the STRIX community.</p>

        <p>Remember, the primary goal of STRIX is enjoyment. The thrill of outmaneuvering two opponents, the satisfaction of a well-executed strategy, and the excitement of a closely contested game are what make STRIX special. We hope you find as much joy in playing STRIX as we have had in designing it.</p>

        <p><strong>Welcome to the world of STRIX. The Nest awaits!</strong></p>
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
