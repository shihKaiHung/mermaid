/* eslint-env jasmine */
import { parser } from './parser/sequenceDiagram';
import sequenceDb from './sequenceDb';
import renderer, { calculateTextHeight, calculateTextWidth } from './sequenceRenderer';
import mermaidAPI from '../../mermaidAPI';

function addConf(conf, key, value) {
  if (value !== undefined) {
    conf[key] = value;
  }
  return conf;
}

describe('when parsing a sequenceDiagram', function() {
  beforeEach(function() {
    parser.yy = sequenceDb;
    parser.yy.clear();
  });
  it('it should handle a sequenceDiagram definition', function() {
    const str = `
sequenceDiagram
Alice->Bob:Hello Bob, how are you?
Note right of Bob: Bob thinks
Bob-->Alice: I am good thanks!`;

    parser.parse(str);
    const actors = parser.yy.getActors();
    expect(actors.Alice.description).toBe('Alice');
    actors.Bob.description = 'Bob';

    const messages = parser.yy.getMessages();

    expect(messages.length).toBe(3);
    expect(messages[0].from).toBe('Alice');
    expect(messages[2].from).toBe('Bob');
  });
  it('it should not show sequence numbers per default', function() {
    const str = `
sequenceDiagram
Alice->Bob:Hello Bob, how are you?
Note right of Bob: Bob thinks
Bob-->Alice: I am good thanks!`;

    parser.parse(str);
    expect(parser.yy.showSequenceNumbers()).toBe(false);
  });
  it('it should show sequence numbers when autonumber is enabled', function() {
    const str = `
sequenceDiagram
autonumber
Alice->Bob:Hello Bob, how are you?
Note right of Bob: Bob thinks
Bob-->Alice: I am good thanks!`;

    parser.parse(str);
    expect(parser.yy.showSequenceNumbers()).toBe(true);
  });
  it('it should handle a sequenceDiagram definition with a title', function() {
    const str = `
sequenceDiagram
title: Diagram Title
Alice->Bob:Hello Bob, how are you?
Note right of Bob: Bob thinks
Bob-->Alice: I am good thanks!`;

    parser.parse(str);
    const actors = parser.yy.getActors();
    expect(actors.Alice.description).toBe('Alice');
    actors.Bob.description = 'Bob';

    const messages = parser.yy.getMessages();
    const title = parser.yy.getTitle();

    expect(messages.length).toBe(3);
    expect(messages[0].from).toBe('Alice');
    expect(messages[2].from).toBe('Bob');
    expect(title).toBe('Diagram Title');
  });
  it('it should space in actor names', function() {
    const str = `
sequenceDiagram
Alice->Bob:Hello Bob, how are - you?
Bob-->Alice: I am good thanks!`;

    parser.parse(str);
    const actors = parser.yy.getActors();
    expect(actors.Alice.description).toBe('Alice');
    actors.Bob.description = 'Bob';

    const messages = parser.yy.getMessages();

    expect(messages.length).toBe(2);
    expect(messages[0].from).toBe('Alice');
    expect(messages[1].from).toBe('Bob');
  });
  it('it should alias participants', function() {
    const str = `
sequenceDiagram
participant A as Alice
participant B as Bob
A->B:Hello Bob, how are you?
B-->A: I am good thanks!`;

    parser.parse(str);

    const actors = parser.yy.getActors();
    expect(Object.keys(actors)).toEqual(['A', 'B']);
    expect(actors.A.description).toBe('Alice');
    expect(actors.B.description).toBe('Bob');

    const messages = parser.yy.getMessages();
    expect(messages.length).toBe(2);
    expect(messages[0].from).toBe('A');
    expect(messages[1].from).toBe('B');
  });
  it('it should handle in async messages', function() {
    const str = `
sequenceDiagram
Alice-xBob:Hello Bob, how are you?`;

    parser.parse(str);
    const actors = parser.yy.getActors();
    expect(actors.Alice.description).toBe('Alice');
    expect(actors.Bob.description).toBe('Bob');

    const messages = parser.yy.getMessages();

    expect(messages.length).toBe(1);
    expect(messages[0].type).toBe(parser.yy.LINETYPE.SOLID_CROSS);
  });
  it('it should handle in async dotted messages', function() {
    const str = `
sequenceDiagram
Alice--xBob:Hello Bob, how are you?`;

    parser.parse(str);
    const actors = parser.yy.getActors();
    expect(actors.Alice.description).toBe('Alice');
    expect(actors.Bob.description).toBe('Bob');

    const messages = parser.yy.getMessages();

    expect(messages.length).toBe(1);
    expect(messages[0].type).toBe(parser.yy.LINETYPE.DOTTED_CROSS);
  });
  it('it should handle in arrow messages', function() {
    const str = `
sequenceDiagram
Alice->>Bob:Hello Bob, how are you?`;

    parser.parse(str);
    const actors = parser.yy.getActors();
    expect(actors.Alice.description).toBe('Alice');
    expect(actors.Bob.description).toBe('Bob');

    const messages = parser.yy.getMessages();

    expect(messages.length).toBe(1);
    expect(messages[0].type).toBe(parser.yy.LINETYPE.SOLID);
  });
  it('it should handle in arrow messages', function() {
    const str = 'sequenceDiagram\n' + 'Alice-->>Bob:Hello Bob, how are you?';

    parser.parse(str);
    const actors = parser.yy.getActors();
    expect(actors.Alice.description).toBe('Alice');
    expect(actors.Bob.description).toBe('Bob');

    const messages = parser.yy.getMessages();

    expect(messages.length).toBe(1);
    expect(messages[0].type).toBe(parser.yy.LINETYPE.DOTTED);
  });
  it('it should handle actor activation', function() {
    const str = `
sequenceDiagram
Alice-->>Bob:Hello Bob, how are you?
activate Bob
Bob-->>Alice:Hello Alice, I'm fine and  you?
deactivate Bob`;

    parser.parse(str);
    const actors = parser.yy.getActors();
    expect(actors.Alice.description).toBe('Alice');
    expect(actors.Bob.description).toBe('Bob');

    const messages = parser.yy.getMessages();

    expect(messages.length).toBe(4);
    expect(messages[0].type).toBe(parser.yy.LINETYPE.DOTTED);
    expect(messages[1].type).toBe(parser.yy.LINETYPE.ACTIVE_START);
    expect(messages[1].from.actor).toBe('Bob');
    expect(messages[2].type).toBe(parser.yy.LINETYPE.DOTTED);
    expect(messages[3].type).toBe(parser.yy.LINETYPE.ACTIVE_END);
    expect(messages[3].from.actor).toBe('Bob');
  });
  it('it should handle actor one line notation activation', function() {
    const str = `
      sequenceDiagram
      Alice-->>+Bob:Hello Bob, how are you?
      Bob-->>- Alice:Hello Alice, I'm fine and  you?`;

    parser.parse(str);
    const actors = parser.yy.getActors();
    expect(actors.Alice.description).toBe('Alice');
    expect(actors.Bob.description).toBe('Bob');

    const messages = parser.yy.getMessages();

    expect(messages.length).toBe(4);
    expect(messages[0].type).toBe(parser.yy.LINETYPE.DOTTED);
    expect(messages[1].type).toBe(parser.yy.LINETYPE.ACTIVE_START);
    expect(messages[1].from.actor).toBe('Bob');
    expect(messages[2].type).toBe(parser.yy.LINETYPE.DOTTED);
    expect(messages[3].type).toBe(parser.yy.LINETYPE.ACTIVE_END);
    expect(messages[3].from.actor).toBe('Bob');
  });
  it('it should handle stacked activations', function() {
    const str = `
      sequenceDiagram
      Alice-->>+Bob:Hello Bob, how are you?
      Bob-->>+Carol:Carol, let me introduce Alice?
      Bob-->>- Alice:Hello Alice, please meet Carol?
      Carol->>- Bob:Oh Bob, I'm so happy to be here!`;

    parser.parse(str);
    const actors = parser.yy.getActors();
    expect(actors.Alice.description).toBe('Alice');
    expect(actors.Bob.description).toBe('Bob');

    const messages = parser.yy.getMessages();

    expect(messages.length).toBe(8);
    expect(messages[0].type).toBe(parser.yy.LINETYPE.DOTTED);
    expect(messages[1].type).toBe(parser.yy.LINETYPE.ACTIVE_START);
    expect(messages[1].from.actor).toBe('Bob');
    expect(messages[2].type).toBe(parser.yy.LINETYPE.DOTTED);
    expect(messages[3].type).toBe(parser.yy.LINETYPE.ACTIVE_START);
    expect(messages[3].from.actor).toBe('Carol');
    expect(messages[5].type).toBe(parser.yy.LINETYPE.ACTIVE_END);
    expect(messages[5].from.actor).toBe('Bob');
    expect(messages[7].type).toBe(parser.yy.LINETYPE.ACTIVE_END);
    expect(messages[7].from.actor).toBe('Carol');
  });
  it('it should handle fail parsing when activating an inactive participant', function() {
    const str = `
      sequenceDiagram
      participant user as End User
      participant Server as Server
      participant System as System
      participant System2 as System2

      user->>+Server: Test
      user->>+Server: Test2
      user->>System: Test
      Server->>-user: Test
      Server->>-user: Test2

      %% The following deactivation of Server will fail
      Server->>-user: Test3`;

    let error = false;
    try {
      parser.parse(str);
    } catch (e) {
      console.log(e.hash);
      error = true;
    }
    expect(error).toBe(true);
  });

  it('it should handle comments in a sequenceDiagram', function() {
    const str = `
      sequenceDiagram
      Alice->Bob: Hello Bob, how are you?
      %% Comment
      Note right of Bob: Bob thinks
      Bob-->Alice: I am good thanks!`;

    parser.parse(str);
    const actors = parser.yy.getActors();
    expect(actors.Alice.description).toBe('Alice');
    actors.Bob.description = 'Bob';

    const messages = parser.yy.getMessages();

    expect(messages.length).toBe(3);
    expect(messages[0].from).toBe('Alice');
    expect(messages[2].from).toBe('Bob');
  });
  it('it should handle new lines in a sequenceDiagram', function() {
    const str = `
      sequenceDiagram
      Alice->Bob: Hello Bob, how are you?

      %% Comment
      Note right of Bob: Bob thinks
      Bob-->Alice: I am good thanks!
      `;

    parser.parse(str);
    const actors = parser.yy.getActors();
    expect(actors.Alice.description).toBe('Alice');
    actors.Bob.description = 'Bob';

    const messages = parser.yy.getMessages();

    expect(messages.length).toBe(3);
    expect(messages[0].from).toBe('Alice');
    expect(messages[2].from).toBe('Bob');
  });
  it('it should handle semicolons', function() {
    const str = `
sequenceDiagram;Alice->Bob: Hello Bob, how are you?;Note right of Bob: Bob thinks;Bob-->Alice: I am good thanks!;`;

    parser.parse(str);
    const actors = parser.yy.getActors();
    expect(actors.Alice.description).toBe('Alice');
    actors.Bob.description = 'Bob';

    const messages = parser.yy.getMessages();

    expect(messages.length).toBe(3);
    expect(messages[0].from).toBe('Alice');
    expect(messages[2].from).toBe('Bob');
  });
  it('it should handle one leading space in lines in a sequenceDiagram', function() {
    const str = `
sequenceDiagram
 Alice->Bob: Hello Bob, how are you?

%% Comment
Note right of Bob: Bob thinks
Bob-->Alice: I am good thanks!`;

    parser.parse(str);
    const actors = parser.yy.getActors();
    expect(actors.Alice.description).toBe('Alice');
    actors.Bob.description = 'Bob';

    const messages = parser.yy.getMessages();

    expect(messages.length).toBe(3);
    expect(messages[0].from).toBe('Alice');
    expect(messages[2].from).toBe('Bob');
  });
  it('it should handle several leading spaces in lines in a sequenceDiagram', function() {
    const str = `
sequenceDiagram
   Alice->Bob: Hello Bob, how are you?

%% Comment
Note right of Bob: Bob thinks
Bob-->Alice: I am good thanks!`;

    parser.parse(str);
    const actors = parser.yy.getActors();
    expect(actors.Alice.description).toBe('Alice');
    actors.Bob.description = 'Bob';

    const messages = parser.yy.getMessages();

    expect(messages.length).toBe(3);
    expect(messages[0].from).toBe('Alice');
    expect(messages[2].from).toBe('Bob');
  });
  it('it should handle several leading spaces in lines in a sequenceDiagram', function() {
    const str = `
sequenceDiagram
participant Alice
participant Bob
Alice->John: Hello John, how are you?
    loop Healthcheck
John->John: Fight against hypochondria
 end
Note right of John: Rational thoughts<br/>prevail...
    John-->Alice: Great!
    John->Bob: How about you?
Bob-->John: Jolly good!`;

    parser.parse(str);
    const actors = parser.yy.getActors();
    expect(actors.Alice.description).toBe('Alice');
    actors.Bob.description = 'Bob';

    const messages = parser.yy.getMessages();

    expect(messages.length).toBe(8);
    expect(messages[0].from).toBe('Alice');
    expect(messages[2].from).toBe('John');
  });
  it('it should handle different line breaks', function() {
    const str = `
sequenceDiagram
participant 1 as multiline<br>text
participant 2 as multiline<br/>text
participant 3 as multiline<br />text
participant 4 as multiline<br \t/>text
1->>2: multiline<br>text
note right of 2: multiline<br>text
2->>3: multiline<br/>text
note right of 3: multiline<br/>text
3->>4: multiline<br />text
note right of 4: multiline<br />text
4->>1: multiline<br \t/>text
note right of 1: multiline<br \t/>text
`;

    parser.parse(str);

    const actors = parser.yy.getActors();
    expect(actors['1'].description).toBe('multiline<br>text');
    expect(actors['2'].description).toBe('multiline<br/>text');
    expect(actors['3'].description).toBe('multiline<br />text');
    expect(actors['4'].description).toBe('multiline<br \t/>text');

    const messages = parser.yy.getMessages();
    expect(messages[0].message).toBe('multiline<br>text');
    expect(messages[1].message).toBe('multiline<br>text');
    expect(messages[2].message).toBe('multiline<br/>text');
    expect(messages[3].message).toBe('multiline<br/>text');
    expect(messages[4].message).toBe('multiline<br />text');
    expect(messages[5].message).toBe('multiline<br />text');
    expect(messages[6].message).toBe('multiline<br \t/>text');
    expect(messages[7].message).toBe('multiline<br \t/>text');
  });
  it('it should handle notes over a single actor', function() {
    const str = `
sequenceDiagram
Alice->Bob: Hello Bob, how are you?
Note over Bob: Bob thinks
`;

    parser.parse(str);

    const messages = parser.yy.getMessages();
    expect(messages[1].from).toBe('Bob');
    expect(messages[1].to).toBe('Bob');
  });
  it('it should handle notes over multiple actors', function() {
    const str = `
sequenceDiagram
Alice->Bob: Hello Bob, how are you?
Note over Alice,Bob: confusion
Note over Bob,Alice: resolution
`;

    parser.parse(str);

    const messages = parser.yy.getMessages();
    expect(messages[1].from).toBe('Alice');
    expect(messages[1].to).toBe('Bob');
    expect(messages[2].from).toBe('Bob');
    expect(messages[2].to).toBe('Alice');
  });
  it('it should handle loop statements', function() {
    const str = `
sequenceDiagram
Alice->Bob: Hello Bob, how are you?

%% Comment
Note right of Bob: Bob thinks
loop Multiple happy responses

Bob-->Alice: I am good thanks!
end`;

    parser.parse(str);
    const actors = parser.yy.getActors();
    expect(actors.Alice.description).toBe('Alice');
    actors.Bob.description = 'Bob';

    const messages = parser.yy.getMessages();

    expect(messages.length).toBe(5);
    expect(messages[0].from).toBe('Alice');
    expect(messages[1].from).toBe('Bob');
  });
  it('it should add a rect around sequence', function() {
    const str = `
      sequenceDiagram
        Alice->Bob: Hello Bob, how are you?
        %% Comment
        rect rgb(200, 255, 200)
        Note right of Bob: Bob thinks
        Bob-->Alice: I am good thanks
        end
    `;

    parser.parse(str);
    const actors = parser.yy.getActors();
    expect(actors.Alice.description).toBe('Alice');
    actors.Bob.description = 'Bob';

    const messages = parser.yy.getMessages();
    expect(messages[1].type).toEqual(parser.yy.LINETYPE.RECT_START);
    expect(messages[1].message).toBe('rgb(200, 255, 200)');
    expect(messages[2].type).toEqual(parser.yy.LINETYPE.NOTE);
    expect(messages[3].type).toEqual(parser.yy.LINETYPE.DOTTED_OPEN);
    expect(messages[4].type).toEqual(parser.yy.LINETYPE.RECT_END);
  });

  it('it should allow for nested rects', function() {
    const str = `
      sequenceDiagram
        Alice->Bob: Hello Bob, how are you?
        %% Comment
        rect rgb(200, 255, 200)
        rect rgb(0, 0, 0)
        Note right of Bob: Bob thinks
        end
        Bob-->Alice: I am good thanks
        end
    `;
    parser.parse(str);
    const actors = parser.yy.getActors();
    expect(actors.Alice.description).toBe('Alice');
    actors.Bob.description = 'Bob';

    const messages = parser.yy.getMessages();
    expect(messages[1].type).toEqual(parser.yy.LINETYPE.RECT_START);
    expect(messages[1].message).toBe('rgb(200, 255, 200)');
    expect(messages[2].type).toEqual(parser.yy.LINETYPE.RECT_START);
    expect(messages[2].message).toBe('rgb(0, 0, 0)');
    expect(messages[3].type).toEqual(parser.yy.LINETYPE.NOTE);
    expect(messages[4].type).toEqual(parser.yy.LINETYPE.RECT_END);
    expect(messages[5].type).toEqual(parser.yy.LINETYPE.DOTTED_OPEN);
    expect(messages[6].type).toEqual(parser.yy.LINETYPE.RECT_END);
  });
  it('it should handle opt statements', function() {
    const str = `
sequenceDiagram
Alice->Bob: Hello Bob, how are you?

%% Comment
Note right of Bob: Bob thinks
opt Perhaps a happy response

Bob-->Alice: I am good thanks!
end`;

    parser.parse(str);
    const actors = parser.yy.getActors();
    expect(actors.Alice.description).toBe('Alice');
    actors.Bob.description = 'Bob';

    const messages = parser.yy.getMessages();

    expect(messages.length).toBe(5);
    expect(messages[0].from).toBe('Alice');
    expect(messages[1].from).toBe('Bob');
  });
  it('it should handle alt statements', function() {
    const str = `
sequenceDiagram
Alice->Bob: Hello Bob, how are you?

%% Comment
Note right of Bob: Bob thinks
alt isWell

Bob-->Alice: I am good thanks!
else isSick
Bob-->Alice: Feel sick...
end`;

    parser.parse(str);
    const actors = parser.yy.getActors();

    expect(actors.Alice.description).toBe('Alice');
    actors.Bob.description = 'Bob';

    const messages = parser.yy.getMessages();

    expect(messages.length).toBe(7);
    expect(messages[0].from).toBe('Alice');
    expect(messages[1].from).toBe('Bob');
  });
  it('it should handle alt statements with multiple elses', function() {
    const str = `
sequenceDiagram
Alice->Bob: Hello Bob, how are you?

%% Comment
Note right of Bob: Bob thinks
alt isWell

Bob-->Alice: I am good thanks!
else isSick
Bob-->Alice: Feel sick...
else default
Bob-->Alice: :-)
end`;
    parser.parse(str);
    const messages = parser.yy.getMessages();
    expect(messages.length).toBe(9);
    expect(messages[1].from).toBe('Bob');
    expect(messages[2].type).toBe(parser.yy.LINETYPE.ALT_START);
    expect(messages[3].from).toBe('Bob');
    expect(messages[4].type).toBe(parser.yy.LINETYPE.ALT_ELSE);
    expect(messages[5].from).toBe('Bob');
    expect(messages[6].type).toBe(parser.yy.LINETYPE.ALT_ELSE);
    expect(messages[7].from).toBe('Bob');
    expect(messages[8].type).toBe(parser.yy.LINETYPE.ALT_END);
  });
  it('it should handle par statements a sequenceDiagram', function() {
    const str = `
sequenceDiagram
par Parallel one
Alice->>Bob: Hello Bob, how are you?
Bob-->>Alice: I am good thanks!
and Parallel two
Alice->>Bob: Are you OK?
Bob-->>Alice: Fine!
and Parallel three
Alice->>Bob: What do you think about it?
Bob-->>Alice: It's good!
end`;

    parser.parse(str);
    const actors = parser.yy.getActors();

    expect(actors.Alice.description).toBe('Alice');
    expect(actors.Bob.description).toBe('Bob');

    const messages = parser.yy.getMessages();

    expect(messages.length).toBe(10);
    expect(messages[0].message).toBe('Parallel one');
    expect(messages[1].from).toBe('Alice');
    expect(messages[2].from).toBe('Bob');
  });
  it('it should handle special characters in signals', function() {
    const str = 'sequenceDiagram\n' + 'Alice->Bob: -:<>,;# comment';

    parser.parse(str);

    const messages = parser.yy.getMessages();
    expect(messages[0].message).toBe('-:<>,');
  });
  it('it should handle special characters in notes', function() {
    const str = `
sequenceDiagram
Alice->Bob: Hello Bob, how are you?
Note right of Bob: -:<>,;# comment`;

    parser.parse(str);

    const messages = parser.yy.getMessages();
    expect(messages[1].message).toBe('-:<>,');
  });
  it('it should handle special characters in loop', function() {
    const str = `
sequenceDiagram
Alice->Bob: Hello Bob, how are you?
loop -:<>,;# comment
Bob-->Alice: I am good thanks!
end`;

    parser.parse(str);

    const messages = parser.yy.getMessages();
    expect(messages[1].message).toBe('-:<>,');
  });
  it('it should handle special characters in opt', function() {
    const str = `
sequenceDiagram
Alice->Bob: Hello Bob, how are you?
opt -:<>,;# comment
Bob-->Alice: I am good thanks!
end`;

    parser.parse(str);

    const messages = parser.yy.getMessages();
    expect(messages[1].message).toBe('-:<>,');
  });
  it('it should handle special characters in alt', function() {
    const str = `
sequenceDiagram
Alice->Bob: Hello Bob, how are you?
alt -:<>,;# comment
Bob-->Alice: I am good thanks!
else ,<>:-#; comment
Bob-->Alice: I am good thanks!
end`;

    parser.parse(str);

    const messages = parser.yy.getMessages();
    expect(messages[1].message).toBe('-:<>,');
    expect(messages[3].message).toBe(',<>:-');
  });
  it('it should handle special characters in par', function() {
    const str = `
sequenceDiagram
Alice->Bob: Hello Bob, how are you?
par -:<>,;# comment
Bob-->Alice: I am good thanks!
and ,<>:-#; comment
Bob-->Alice: I am good thanks!
end`;

    parser.parse(str);

    const messages = parser.yy.getMessages();
    expect(messages[1].message).toBe('-:<>,');
    expect(messages[3].message).toBe(',<>:-');
  });
  it('it should handle no-label loop', function() {
    const str = `
sequenceDiagram
Alice->Bob: Hello Bob, how are you?
loop
Bob-->Alice: I am good thanks!
end`;

    parser.parse(str);

    const messages = parser.yy.getMessages();
    expect(messages[1].message).toBe('');
    expect(messages[2].message).toBe('I am good thanks!');
  });
  it('it should handle no-label opt', function() {
    const str = `
sequenceDiagram
Alice->Bob: Hello Bob, how are you?
opt # comment
Bob-->Alice: I am good thanks!
end`;

    parser.parse(str);

    const messages = parser.yy.getMessages();
    expect(messages[1].message).toBe('');
    expect(messages[2].message).toBe('I am good thanks!');
  });
  it('it should handle no-label alt', function() {
    const str = `
sequenceDiagram
Alice->Bob: Hello Bob, how are you?
alt;Bob-->Alice: I am good thanks!
else # comment
Bob-->Alice: I am good thanks!
end`;

    parser.parse(str);

    const messages = parser.yy.getMessages();
    expect(messages[1].message).toBe('');
    expect(messages[2].message).toBe('I am good thanks!');
    expect(messages[3].message).toBe('');
    expect(messages[4].message).toBe('I am good thanks!');
  });
  it('it should handle no-label par', function() {
    const str = `
sequenceDiagram
Alice->Bob: Hello Bob, how are you?
par;Bob-->Alice: I am good thanks!
and # comment
Bob-->Alice: I am good thanks!
end`;

    parser.parse(str);

    const messages = parser.yy.getMessages();
    expect(messages[1].message).toBe('');
    expect(messages[2].message).toBe('I am good thanks!');
    expect(messages[3].message).toBe('');
    expect(messages[4].message).toBe('I am good thanks!');
  });
});

describe('when checking the bounds in a sequenceDiagram', function() {
  let conf;
  beforeEach(function() {
    parser.yy = sequenceDb;
    parser.yy.clear();
    conf = {
      diagramMarginX: 50,
      diagramMarginY: 10,
      actorMargin: 50,
      width: 150,
      // Height of actor boxes
      height: 65,
      boxMargin: 10,
      messageMargin: 40,
      boxTextMargin: 15,
      noteMargin: 25
    };
    renderer.setConf(conf);
  });
  it('it should handle a simple bound call', function() {
    renderer.bounds.init();

    renderer.bounds.insert(100, 100, 200, 200);

    const bounds = renderer.bounds.getBounds();
    expect(bounds.startx).toBe(100);
    expect(bounds.starty).toBe(100);
    expect(bounds.stopx).toBe(200);
    expect(bounds.stopy).toBe(200);
  });
  it('it should handle an expanding bound', function() {
    renderer.bounds.init();

    renderer.bounds.insert(100, 100, 200, 200);
    renderer.bounds.insert(25, 50, 300, 400);

    const bounds = renderer.bounds.getBounds();
    expect(bounds.startx).toBe(25);
    expect(bounds.starty).toBe(50);
    expect(bounds.stopx).toBe(300);
    expect(bounds.stopy).toBe(400);
  });
  it('it should handle inserts within the bound without changing the outer bounds', function() {
    renderer.bounds.init();

    renderer.bounds.insert(100, 100, 200, 200);
    renderer.bounds.insert(25, 50, 300, 400);
    renderer.bounds.insert(125, 150, 150, 200);

    const bounds = renderer.bounds.getBounds();
    expect(bounds.startx).toBe(25);
    expect(bounds.starty).toBe(50);
    expect(bounds.stopx).toBe(300);
    expect(bounds.stopy).toBe(400);
  });
  it('it should handle a loop without expanding the area', function() {
    renderer.bounds.init();

    renderer.bounds.insert(25, 50, 300, 400);
    renderer.bounds.verticalPos = 150;
    renderer.bounds.newLoop();
    renderer.bounds.insert(125, 150, 150, 200);

    const loop = renderer.bounds.endLoop();

    expect(loop.startx).toBe(125 - conf.boxMargin);
    expect(loop.starty).toBe(150 - conf.boxMargin);
    expect(loop.stopx).toBe(150 + conf.boxMargin);
    expect(loop.stopy).toBe(200 + conf.boxMargin);

    // Check bounds of first loop
    const bounds = renderer.bounds.getBounds();

    expect(bounds.startx).toBe(25);
    expect(bounds.starty).toBe(50);
    expect(bounds.stopx).toBe(300);
    expect(bounds.stopy).toBe(400);
  });
  it('it should handle multiple loops withtout expanding the bounds', function() {
    renderer.bounds.init();

    renderer.bounds.insert(100, 100, 1000, 1000);
    renderer.bounds.verticalPos = 200;
    renderer.bounds.newLoop();
    renderer.bounds.newLoop();
    renderer.bounds.insert(200, 200, 300, 300);

    // Check bounds of first loop
    let loop = renderer.bounds.endLoop();

    expect(loop.startx).toBe(200 - conf.boxMargin);
    expect(loop.starty).toBe(200 - conf.boxMargin);
    expect(loop.stopx).toBe(300 + conf.boxMargin);
    expect(loop.stopy).toBe(300 + conf.boxMargin);

    // Check bounds of second loop
    loop = renderer.bounds.endLoop();

    expect(loop.startx).toBe(200 - 2 * conf.boxMargin);
    expect(loop.starty).toBe(200 - 2 * conf.boxMargin);
    expect(loop.stopx).toBe(300 + 2 * conf.boxMargin);
    expect(loop.stopy).toBe(300 + 2 * conf.boxMargin);

    // Check bounds of first loop
    const bounds = renderer.bounds.getBounds();

    expect(bounds.startx).toBe(100);
    expect(bounds.starty).toBe(100);
    expect(bounds.stopx).toBe(1000);
    expect(bounds.stopy).toBe(1000);
  });
  it('it should handle a loop that expands the area', function() {
    renderer.bounds.init();

    renderer.bounds.insert(100, 100, 200, 200);
    renderer.bounds.verticalPos = 200;
    renderer.bounds.newLoop();
    renderer.bounds.insert(50, 50, 300, 300);

    const loop = renderer.bounds.endLoop();

    expect(loop.startx).toBe(50 - conf.boxMargin);
    expect(loop.starty).toBe(50 - conf.boxMargin);
    expect(loop.stopx).toBe(300 + conf.boxMargin);
    expect(loop.stopy).toBe(300 + conf.boxMargin);

    // Check bounds after the loop
    const bounds = renderer.bounds.getBounds();

    expect(bounds.startx).toBe(loop.startx);
    expect(bounds.starty).toBe(loop.starty);
    expect(bounds.stopx).toBe(loop.stopx);
    expect(bounds.stopy).toBe(loop.stopy);
  });
});

describe('when rendering a sequenceDiagram', function() {
  let conf;
  beforeEach(function() {
    parser.yy = sequenceDb;
    parser.yy.clear();

    conf = {
      diagramMarginX: 50,
      diagramMarginY: 10,
      actorMargin: 50,
      width: 150,
      // Height of actor boxes
      height: 65,
      boxMargin: 10,
      messageMargin: 40,
      boxTextMargin: 15,
      noteMargin: 25
    };
    renderer.setConf(conf);
  });
  ['tspan', 'fo', 'old', undefined].forEach(function(textPlacement) {
    it(`
it should handle one actor, when textPlacement is ${textPlacement}`, function() {
      renderer.setConf(addConf(conf, 'textPlacement', textPlacement));
      renderer.bounds.init();
      const str = `
sequenceDiagram
participant Alice`;

      parser.parse(str);
      renderer.draw(str, 'tst');

      const bounds = renderer.bounds.getBounds();
      expect(bounds.startx).toBe(0);
      expect(bounds.starty).toBe(0);
      expect(bounds.stopx).toBe(conf.width);
      expect(bounds.stopy).toBe(conf.height);
    });
  });
  it('it should handle same actor with different whitespace properly', function() {
    renderer.bounds.init();

    const str = `
sequenceDiagram
participant Alice
participant Alice
participant Alice
`;

    parser.parse(str);

    const actors = parser.yy.getActors();
    expect(Object.keys(actors)).toEqual(['Alice']);
  });
  it('it should handle one actor and a centered note', function() {
    renderer.bounds.init();
    const str = `
sequenceDiagram
participant Alice
Note over Alice: Alice thinks
`;

    parser.parse(str);
    renderer.draw(str, 'tst');

    const bounds = renderer.bounds.getBounds();
    expect(bounds.startx).toBe(0);
    expect(bounds.starty).toBe(0);
    expect(bounds.stopx).toBe(conf.width);
    // 10 comes from mock of text height
    expect(bounds.stopy).toBe(conf.height + conf.boxMargin + 2 * conf.noteMargin + 10);
  });
  it('it should handle one actor and a note to the left', function() {
    renderer.bounds.init();
    const str = `
sequenceDiagram
participant Alice
Note left of Alice: Alice thinks`;

    parser.parse(str);
    renderer.draw(str, 'tst');

    const bounds = renderer.bounds.getBounds();
    expect(bounds.startx).toBe(-(conf.width / 2) - conf.actorMargin / 2);
    expect(bounds.starty).toBe(0);
    expect(bounds.stopx).toBe(conf.width);
    // 10 comes from mock of text height
    expect(bounds.stopy).toBe(conf.height + conf.boxMargin + 2 * conf.noteMargin + 10);
  });
  it('it should handle one actor and a note to the right', function() {
    renderer.bounds.init();
    const str = `
sequenceDiagram
participant Alice
Note right of Alice: Alice thinks`;

    parser.parse(str);
    renderer.draw(str, 'tst');

    const bounds = renderer.bounds.getBounds();
    expect(bounds.startx).toBe(0);
    expect(bounds.starty).toBe(0);
    expect(bounds.stopx).toBe(conf.width / 2 + conf.actorMargin / 2 + conf.width);
    // 10 comes from mock of text height
    expect(bounds.stopy).toBe(conf.height + conf.boxMargin + 2 * conf.noteMargin + 10);
  });
  it('it should handle two actors', function() {
    renderer.bounds.init();
    const str = `
sequenceDiagram
Alice->Bob: Hello Bob, how are you?`;

    parser.parse(str);
    renderer.draw(str, 'tst');

    const bounds = renderer.bounds.getBounds();
    expect(bounds.startx).toBe(0);
    expect(bounds.starty).toBe(0);
    expect(bounds.stopx).toBe(conf.width * 2 + conf.actorMargin);
    expect(bounds.stopy).toBe(0 + conf.messageMargin + conf.height);
  });
  it('it should handle two actors with init directive', function() {
    renderer.bounds.init();
    const str = `
%%{init: {'logLevel': 0}}%%
sequenceDiagram
Alice->Bob: Hello Bob, how are you?`;

    parser.parse(str);
    renderer.draw(str, 'tst');

    const bounds = renderer.bounds.getBounds();
    const mermaid = mermaidAPI.getConfig();
    expect(mermaid.logLevel).toBe(0);
    expect(bounds.startx).toBe(0);
    expect(bounds.starty).toBe(0);
    expect(bounds.stopx).toBe(conf.width * 2 + conf.actorMargin);
    expect(bounds.stopy).toBe(0 + conf.messageMargin + conf.height);
  });
  it('it should handle two actors with init directive with multiline directive', function() {
    renderer.bounds.init();
    const str = `
%%{init: { 'logLevel': 0}}%%
sequenceDiagram
%%{
wrap
}%%
Alice->Bob: Hello Bob, how are you?`;

    parser.parse(str);
    renderer.draw(str, 'tst');

    const bounds = renderer.bounds.getBounds();
    const mermaid = mermaidAPI.getConfig();
    expect(mermaid.logLevel).toBe(0);
    expect(bounds.startx).toBe(0);
    expect(bounds.starty).toBe(0);
    expect(bounds.stopx).toBe(conf.width * 2 + conf.actorMargin);
    expect(bounds.stopy).toBe(0 + conf.messageMargin + conf.height);
  });
  it('it should handle two actors and two centered shared notes', function() {
    renderer.bounds.init();
    const str = `
sequenceDiagram
Alice->Bob: Hello Bob, how are you?
Note over Alice,Bob: Looks
Note over Bob,Alice: Looks back
`;

    parser.parse(str);
    renderer.draw(str, 'tst');

    const bounds = renderer.bounds.getBounds();
    expect(bounds.startx).toBe(0);
    expect(bounds.starty).toBe(0);
    expect(bounds.stopx).toBe(conf.width * 2 + conf.actorMargin);
    expect(bounds.stopy).toBe(
      conf.height + conf.messageMargin + 2 * (conf.boxMargin + 2 * conf.noteMargin + 10)
    );
  });
  it('it should draw two actors and two messages', function() {
    renderer.bounds.init();
    const str = `
sequenceDiagram
Alice->Bob: Hello Bob, how are you?
Bob->Alice: Fine!`;

    parser.parse(str);
    renderer.draw(str, 'tst');

    const bounds = renderer.bounds.getBounds();
    expect(bounds.startx).toBe(0);
    expect(bounds.starty).toBe(0);
    expect(bounds.stopx).toBe(0 + conf.width * 2 + conf.actorMargin);
    expect(bounds.stopy).toBe(0 + 2 * conf.messageMargin + conf.height);
  });
  it('it should draw two actors notes to the right', function() {
    renderer.bounds.init();
    const str = `
sequenceDiagram
Alice->Bob: Hello Bob, how are you?
Note right of Bob: Bob thinks
Bob->Alice: Fine!`;

    parser.parse(str);
    renderer.draw(str, 'tst');

    const bounds = renderer.bounds.getBounds();
    expect(bounds.startx).toBe(0);
    expect(bounds.starty).toBe(0);

    const expStopX = conf.actorMargin + conf.width + conf.width / 2 + conf.noteMargin + conf.width;

    expect(bounds.stopx).toBe(expStopX);
    expect(bounds.stopy).toBe(
      2 * conf.messageMargin + conf.height + conf.boxMargin + 10 + 2 * conf.noteMargin
    );
  });
  it('it should draw two actors notes to the left', function() {
    renderer.bounds.init();
    const str = `
sequenceDiagram
Alice->Bob: Hello Bob, how are you?
Note left of Alice: Bob thinks
Bob->Alice: Fine!`;

    parser.parse(str);
    renderer.draw(str, 'tst');

    const bounds = renderer.bounds.getBounds();
    expect(bounds.startx).toBe(-(conf.width / 2) - conf.actorMargin / 2);
    expect(bounds.starty).toBe(0);

    expect(bounds.stopx).toBe(conf.width * 2 + conf.actorMargin);
    expect(bounds.stopy).toBe(
      2 * conf.messageMargin + conf.height + conf.boxMargin + 10 + 2 * conf.noteMargin
    );
  });
  it('it should draw two actors notes to the left with text wrapped (inline)', function() {
    renderer.bounds.init();
    const str = `
sequenceDiagram
Alice->>Bob:wrap: Hello Bob, how are you? If you are not available right now, I can leave you a message. Please get back to me as soon as you can!
Note left of Alice: Bob thinks
Bob->>Alice: Fine!`;

    parser.parse(str);
    renderer.draw(str, 'tst');

    const bounds = renderer.bounds.getBounds();
    const msgs = parser.yy.getMessages();
    expect(bounds.startx).toBe(-(conf.width / 2) - conf.actorMargin / 2);
    expect(bounds.starty).toBe(0);
    expect(msgs[0].wrap).toBe(true);

    expect(bounds.stopx).toBe(conf.width * 2 + conf.actorMargin);
    expect(bounds.stopy).toBe(
      2 * conf.messageMargin + conf.height + conf.boxMargin + 10 + 2 * conf.noteMargin
    );
  });
  it('it should draw two actors notes to the left with text wrapped (directive)', function() {
    renderer.bounds.init();
    const str = `
%%{init: { 'theme': 'dark' } }%%
sequenceDiagram
%%{wrap}%%
Alice->>Bob: Hello Bob, how are you? If you are not available right now, I can leave you a message. Please get back to me as soon as you can!
Note left of Alice: Bob thinks
Bob->>Alice: Fine!`;

    parser.parse(str);
    renderer.draw(str, 'tst');

    const bounds = renderer.bounds.getBounds();
    const msgs = parser.yy.getMessages();
    const mermaid = mermaidAPI.getConfig();
    expect(bounds.startx).toBe(-(conf.width / 2) - conf.actorMargin / 2);
    expect(bounds.starty).toBe(0);
    expect(mermaid.theme).toBe('dark');
    expect(msgs.every(v => v.wrap)).toBe(true);

    expect(bounds.stopx).toBe(conf.width * 2 + conf.actorMargin);
    expect(bounds.stopy).toBe(
      2 * conf.messageMargin + conf.height + conf.boxMargin + 10 + 2 * conf.noteMargin
    );
  });
  it('it should draw two actors notes to the left with text wrapped and the init directive sets the theme to dark', function() {
    renderer.bounds.init();
    const str = `
%%{init:{'theme':'dark'}}%%
sequenceDiagram
%%{wrap}%%
Alice->>Bob: Hello Bob, how are you? If you are not available right now, I can leave you a message. Please get back to me as soon as you can!
Note left of Alice: Bob thinks
Bob->>Alice: Fine!`;
    parser.parse(str);
    renderer.draw(str, 'tst');

    const bounds = renderer.bounds.getBounds();
    const msgs = parser.yy.getMessages();
    const mermaid = mermaidAPI.getConfig();
    expect(bounds.startx).toBe(-(conf.width / 2) - conf.actorMargin / 2);
    expect(bounds.starty).toBe(0);
    expect(mermaid.theme).toBe('dark');
    expect(msgs.every(v => v.wrap)).toBe(true);

    expect(bounds.stopx).toBe(conf.width * 2 + conf.actorMargin);
    expect(bounds.stopy).toBe(
      2 * conf.messageMargin + conf.height + conf.boxMargin + 10 + 2 * conf.noteMargin
    );
  });
  it('it should draw two actors notes to the left with text wrapped and the init directive sets the theme to dark and fontFamily to Menlo, fontSize to 18, and fontWeight to 800', function() {
    renderer.bounds.init();
    const str = `
%%{init: { "theme": "dark" }}%%
sequenceDiagram
%%{config: { "fontFamily": "Menlo", "fontSize": 18, "fontWeight": 400 } }%%
%%{wrap}%%
Alice->>Bob: Hello Bob, how are you? If you are not available right now, I can leave you a message. Please get back to me as soon as you can!
Note left of Alice: Bob thinks
Bob->>Alice: Fine!`;
    parser.parse(str);
    renderer.draw(str, 'tst');

    const bounds = renderer.bounds.getBounds();
    const msgs = parser.yy.getMessages();
    const mermaid = mermaidAPI.getConfig();
    expect(bounds.startx).toBe(-(conf.width / 2) - conf.actorMargin / 2);
    expect(bounds.starty).toBe(0);
    expect(mermaid.theme).toBe('dark');
    expect(mermaid.fontFamily).toBe('Menlo');
    expect(mermaid.fontSize).toBe(18);
    expect(mermaid.fontWeight).toBe(400);
    expect(msgs.every(v => v.wrap)).toBe(true);

    expect(bounds.stopx).toBe(conf.width * 2 + conf.actorMargin);
    expect(bounds.stopy).toBe(
      2 * conf.messageMargin + conf.height + conf.boxMargin + 10 + 2 * conf.noteMargin
    );
  });
  it('it should draw two loops', function() {
    renderer.bounds.init();
    const str = `
sequenceDiagram
Alice->Bob: Hello Bob, how are you?
loop Cheers
Bob->Alice: Fine!
end`;
    parser.parse(str);
    renderer.draw(str, 'tst');

    const bounds = renderer.bounds.getBounds();
    expect(bounds.startx).toBe(0);
    expect(bounds.starty).toBe(0);

    expect(bounds.stopx).toBe(conf.width * 2 + conf.actorMargin);
    expect(bounds.stopy).toBe(
      2 * conf.messageMargin + conf.height + 3 * conf.boxMargin + conf.boxTextMargin
    );
  });
  it('it should draw background rect', function() {
    renderer.bounds.init();
    const str = `
      sequenceDiagram
        Alice->Bob: Hello Bob, are you alright?
        rect rgb(0, 0, 0)
          Bob->Alice: I feel surrounded by darkness
        end
    `;
    parser.parse(str);
    renderer.draw(str, 'tst');
    const bounds = renderer.bounds.getBounds();
    expect(bounds.startx).toBe(0);
    expect(bounds.starty).toBe(0);

    expect(bounds.stopx).toBe(0 + conf.width * 2 + conf.actorMargin);
    expect(bounds.stopy).toBe(0 + 2 * conf.messageMargin + conf.height + 3 * conf.boxMargin);
  });
});

describe('when rendering a sequenceDiagram with actor mirror activated', function() {
  let conf;
  beforeEach(function() {
    parser.yy = sequenceDb;
    parser.yy.clear();

    conf = {
      diagramMarginX: 50,
      diagramMarginY: 10,
      actorMargin: 50,
      width: 150,
      // Height of actor boxes
      height: 65,
      boxMargin: 10,
      messageMargin: 40,
      boxTextMargin: 15,
      noteMargin: 25,
      mirrorActors: true,
      // Depending on css styling this might need adjustment
      // Prolongs the edge of the diagram downwards
      bottomMarginAdj: 1
    };
    renderer.setConf(conf);
  });
  ['tspan', 'fo', 'old', undefined].forEach(function(textPlacement) {
    it('it should handle one actor, when textPlacement is' + textPlacement, function() {
      renderer.setConf(addConf(conf, 'textPlacement', textPlacement));
      renderer.bounds.init();
      const str = `
sequenceDiagram
participant Alice`;

      parser.parse(str);
      renderer.draw(str, 'tst');

      const bounds = renderer.bounds.getBounds();
      expect(bounds.startx).toBe(0);
      expect(bounds.starty).toBe(0);
      expect(bounds.stopx).toBe(conf.width);
      expect(bounds.stopy).toBe(2 * conf.height + 2 * conf.boxMargin);
    });
  });
});

describe('when rendering a sequenceDiagram with directives', function() {
  let conf;
  beforeEach(function() {
    parser.yy = sequenceDb;
    parser.yy.clear();
    conf = {
      diagramMarginX: 50,
      diagramMarginY: 10,
      actorMargin: 50,
      width: 150,
      // Height of actor boxes
      height: 65,
      boxMargin: 10,
      messageMargin: 40,
      boxTextMargin: 15,
      noteMargin: 25
    };
    renderer.setConf(conf);
  });

  it('it should handle one actor, when theme is dark and logLevel is 1 DX1', function() {
    renderer.bounds.init();
    const str = `
%%{init: { "theme": "dark", "logLevel": 1 } }%%
sequenceDiagram
%%{wrap}%%
participant Alice
`;

    parser.parse(str);
    renderer.draw(str, 'tst');

    const bounds = renderer.bounds.getBounds();
    const mermaid = mermaidAPI.getConfig();
    expect(mermaid.theme).toBe('dark');
    expect(mermaid.logLevel).toBe(1);
    expect(bounds.startx).toBe(0);
    expect(bounds.startx).toBe(0);
    expect(bounds.starty).toBe(0);
    expect(bounds.stopy).toBe(2 * conf.height + 2 * conf.boxMargin);
  });
  it('it should handle one actor, when logLevel is 3', function() {
    renderer.bounds.init();
    const str = `
%%{initialize: { "logLevel": 3 }}%%
sequenceDiagram
participant Alice
`;

    parser.parse(str);
    renderer.draw(str, 'tst');

    const bounds = renderer.bounds.getBounds();
    const mermaid = mermaidAPI.getConfig();
    expect(mermaid.logLevel).toBe(3);
    expect(bounds.startx).toBe(0);
    expect(bounds.startx).toBe(0);
    expect(bounds.starty).toBe(0);
    expect(bounds.stopy).toBe(2 * conf.height + 2 * conf.boxMargin);
  });
});
