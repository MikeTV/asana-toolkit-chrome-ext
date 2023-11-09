'use strict';

/* TODO: 
 *    Show summaries on daily calendar, not just lists
 *		Translate comments	 
 *    Refactor the rest of the code for maintainability
 */

// Constants
const SP_NUMBER_BADGES = ['0.25', '0.5', '1', '2', '3', '5', '7', '?'];
const SP_EMOJI_BADGES = ['🏁', '🚩', '🔁', '📅', '🚧', '⚓', '❌', '✅', '⭐', '📝'];
const EMOJI_DESCRIPTIONS = {
  '🏁': 'Milestone (collection of epics)',
  '🚩': 'Epic (collection of tasks)',
  '🔁': 'Recurring',
  '📅': 'Meeting',
  '🚧': 'Blocked (link to or describe blocker)',
  '⚓': 'Must be this date',
  '❌': 'Failed',
  '✅': 'Completed',
  '⭐': 'Important'
};

const badgeStyle = {
    background: '#252628',
    borderRadius: '2px',
    minWidth: '14px',
    height: '14px',
    padding: '5px',
    color: '#f5f4f3',
    textAlign: 'center',
    fontWeight: '400',
    marginLeft: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    lineHeight: '14px'
}
const countStyle = {
    'padding': '0 5px',
    'color': '#000',
    'opacity': '0.7',
    'text-align': 'center',
    'font-weight': '600',
    'margin-left': '4px',
    'font-size': '18px'
}

const clearBadgeColor = '#3b3d41';
const syncSubtaskBadgeColor = '#385f4e';
const completedBadgeColor = '#a66a0c';

function createBadge(textContent, badgeColor, clickCallback) {
  const badgeElement = document.createElement('span');
  badgeElement.textContent = textContent;
  Object.keys(badgeStyle).forEach(key => {
    badgeElement.style[key] = badgeStyle[key];
  });
  badgeElement.style.background = badgeColor;
  badgeElement.addEventListener('click', clickCallback, false);

  // Add title for tooltip
  if (EMOJI_DESCRIPTIONS[textContent]) {
    badgeElement.setAttribute('title', EMOJI_DESCRIPTIONS[textContent]);
  }

  return badgeElement;
}

function handleTitleModification(titleTextArea, pattern, replacement) {
  titleTextArea.focus();

  if (pattern.test(titleTextArea.value)) {
    titleTextArea.value = titleTextArea.value.replace(pattern, replacement);
  } else if (replacement) {  // If there is a replacement but no match in the titleTextArea
    titleTextArea.value = replacement + titleTextArea.value;
  }


  var evt = document.createEvent('KeyboardEvent');
  evt.initEvent('input', true, false);
  // adding this created a magic and passes it as if keypressed
  titleTextArea.dispatchEvent(evt);
  titleTextArea.blur()
}

function clearBadgeHandler() {
  const titleTextArea = document.querySelector('.simpleTextarea--dynamic');
  if (!titleTextArea) return;
  handleTitleModification(titleTextArea, /^\(.+\) /, '');
  //handleTitleModification(titleTextArea, / \[.+\]/, '');
}

function syncSubtaskHandler() {
  const titleTextArea = document.querySelector('.simpleTextarea--dynamic');
  if (!titleTextArea) return;

  const subtasks = document.querySelectorAll('.TaskList > .DropTargetRow');
  let subtasksNotCompletedStoryPoint = 0, subtasksCompletedStoryPoint = 0;

  subtasks.forEach(subtask => {
    const isCompleted = !!subtask.querySelector('.TaskRowCompletionStatus-checkbox--complete');
    const subtaskTitleElement = subtask.querySelector('.AutogrowTextarea-shadow');
    if (subtaskTitleElement) {
      const spMatched = subtaskTitleElement.textContent.match(/^\((\d+(?:\.\d+)?)\)/);
      if (spMatched) {
        if (isCompleted) {
          subtasksCompletedStoryPoint += Number(spMatched[1]);
        }
        subtasksNotCompletedStoryPoint += Number(spMatched[1]);
      }
    }
  });

  const titlePrefix = subtasksNotCompletedStoryPoint ? `(${subtasksNotCompletedStoryPoint}) ` : '';
  const titlePostfix = subtasksCompletedStoryPoint ? ` [${subtasksCompletedStoryPoint}]` : '';
  handleTitleModification(titleTextArea, /^\(.+\) /, titlePrefix);
  //handleTitleModification(titleTextArea, / \[.+\]/, titlePostfix);
}

function emojiBadgeHandler(emoji) {
  const titleTextArea = document.querySelector('.simpleTextarea--dynamic');
  if (!titleTextArea) return;

  // Check if the emoji is already present
  const emojiPattern = new RegExp(`\\s?${escapeRegExp(emoji)}\\s?`, 'g');
  if (emojiPattern.test(titleTextArea.value)) {
    // If present, remove it
    titleTextArea.value = titleTextArea.value.replace(emojiPattern, ' ').trim();
  } else {
    // Otherwise, insert it
    const existingBadgeMatch = titleTextArea.value.match(/^\(([^)]+)\)/);
    if (existingBadgeMatch) {
      titleTextArea.value = titleTextArea.value.replace(existingBadgeMatch[0], `${existingBadgeMatch[0]} ${emoji}`);
    } else {
      titleTextArea.value = `${emoji} ${titleTextArea.value}`;
    }
  }

  var evt = document.createEvent('KeyboardEvent');
  evt.initEvent('input', true, false);
  titleTextArea.dispatchEvent(evt);
  titleTextArea.blur();
}

// Helper function to escape regex special characters
function escapeRegExp(string) {
  return string.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}


// Add badges to card detail panel
setInterval(() => {
  const bodyContainer = document.querySelector('.TaskPaneFields');
  const titleTextArea = document.querySelector('.simpleTextarea--dynamic');

  if (!bodyContainer || !titleTextArea) return;
  if (document.getElementsByClassName('badge-container').length) return;

  const numberBadgeElements = SP_NUMBER_BADGES.map(badgeValue => {
    return createBadge(badgeValue, badgeStyle.background, (e) => {
      handleTitleModification(titleTextArea, /^\(.+\) /, `(${badgeValue}) `);
    });
  });

  const emojiBadgeElements = SP_EMOJI_BADGES.map(emoji => {
    return createBadge(emoji, badgeStyle.background, (e) => {
      emojiBadgeHandler(emoji);
    });
  });

  numberBadgeElements.unshift(createBadge('X', clearBadgeColor, clearBadgeHandler));
  numberBadgeElements.push(createBadge('Sync ↑', syncSubtaskBadgeColor, syncSubtaskHandler));

  let numberBadgeContainer = document.createElement('div');
  numberBadgeContainer.style.display = 'flex';
  numberBadgeContainer.style.margin = '2px 10px';
  numberBadgeContainer.className = 'badge-container LabeledRowStructure-right';
  numberBadgeElements.forEach(element => numberBadgeContainer.appendChild(element));

  let emojiBadgeContainer = document.createElement('div');
  emojiBadgeContainer.style.display = 'flex';
  emojiBadgeContainer.style.margin = '2px 10px';
  emojiBadgeContainer.className = 'badge-container LabeledRowStructure-right';
  emojiBadgeElements.forEach(element => emojiBadgeContainer.appendChild(element));

  // Constructing the number badge field container
  let numberFieldContainer = document.createElement('div');
  numberFieldContainer.className = 'LabeledRowStructure';

  const numberRightColumn = document.createElement('div');
  numberRightColumn.style.width = '100px';
  numberRightColumn.className = 'LabeledRowStructure-left';
  const numberLabel = document.createElement('label');
  numberLabel.className = 'LabeledRowStructure-label';
  numberLabel.textContent = 'Estimated time';
  numberRightColumn.appendChild(numberLabel);

  numberFieldContainer.appendChild(numberRightColumn);
  numberFieldContainer.appendChild(numberBadgeContainer);

  // Constructing the emoji badge field container
  let emojiFieldContainer = document.createElement('div');
  emojiFieldContainer.className = 'LabeledRowStructure';

  const emojiRightColumn = document.createElement('div');
  emojiRightColumn.style.width = '100px';
  emojiRightColumn.className = 'LabeledRowStructure-left';
  const emojiLabel = document.createElement('label');
  emojiLabel.className = 'LabeledRowStructure-label';
  emojiLabel.textContent = 'Emoji Label';
  emojiRightColumn.appendChild(emojiLabel);

  emojiFieldContainer.appendChild(emojiRightColumn);
  emojiFieldContainer.appendChild(emojiBadgeContainer);

  // Insert fieldContainers above the last child of bodyContainer
  bodyContainer.insertBefore(numberFieldContainer, bodyContainer.lastElementChild);
  bodyContainer.insertBefore(emojiFieldContainer, bodyContainer.lastElementChild);

}, 1000);


// Display point totals by card row on the board at the top
setInterval(() => {
    // Elements to manipulate
    const boardColumnsPromise = getElementsUntilRendered(document, '.BoardColumn', 100)

    // Once all the elements have been fetched (when cards are displayed)
    boardColumnsPromise
        .catch(error => {})
		.then(boardColumns => {
            let totalNotCompletedStoryPoint = 0, totalCompletedStoryPoint = 0;

			if(!boardColumns){return;}
			
            // Aggregate by each column
            boardColumns.forEach(boardColumn => {

                // Elements to manipulate
                const boardColumnHeader = boardColumn.querySelector('.BoardColumnHeader')
                const boardCardNames = boardColumn.querySelectorAll('.BoardCard-taskName')

                // Calculate SP
                let columnTotalNotCompletedStoryPoint = 0, columnTotalCompletedStoryPoint = 0;
                Array.prototype.forEach.call(boardCardNames, (e) => {
                    const isCompleted = e.parentElement.parentElement.getElementsByClassName('TaskRowCompletionStatus-taskCompletionIcon--complete').length !== 0;
                    const sp_matched = e.textContent.match(/^\((\d+(?:\.\d+)?)\)/) // SP example: (10) tasks => 10
                    const sp_subtask_completed_matched = e.textContent.match(/\[(\d+(?:\.\d+)?)\]$/) // Partially completed task SP Example: (10) task [5] => 5/5
                    if(sp_matched){
                        if(isCompleted) {
                            columnTotalCompletedStoryPoint += Number(sp_matched[1])
                        } else {
                            if(sp_subtask_completed_matched) {
                                // Has subtask completion SP
                                columnTotalNotCompletedStoryPoint += Number(sp_matched[1]) - Number(sp_subtask_completed_matched[1])
                                columnTotalCompletedStoryPoint += Number(sp_subtask_completed_matched[1])
                            } else {
                                columnTotalNotCompletedStoryPoint += Number(sp_matched[1])
                            }
                        }
                    }
                })
                totalNotCompletedStoryPoint += columnTotalNotCompletedStoryPoint
                totalCompletedStoryPoint += columnTotalCompletedStoryPoint

                // Number of items
                {
                    const hasTotalCountElement = boardColumn.querySelector('.columntop-count-story-point')
                    if(hasTotalCountElement){
                        hasTotalCountElement.textContent = displayNumber(boardCardNames.length)
                    } else {
                        // Create a total badge to display at the top
                        let totalStoryPointElement = document.createElement('span')
                        totalStoryPointElement.className = 'columntop-count-story-point'
                        totalStoryPointElement.textContent = displayNumber(boardCardNames.length)
                        Object.keys(countStyle).forEach(key => {
                            totalStoryPointElement.style[key] = countStyle[key]
                        })

                        boardColumnHeader.appendChild(totalStoryPointElement)
                    }
                }
                // Uncompleted StoryPoint
                {
                    const hasTotalStoryPointElement = boardColumn.querySelector('.columntop-notcompleted-story-point')
                    if(hasTotalStoryPointElement){
                        hasTotalStoryPointElement.textContent = displayNumber(columnTotalNotCompletedStoryPoint)
                    } else {
                        // Create a total badge to display at the top
                        let totalStoryPointElement = document.createElement('span')
                        totalStoryPointElement.className = 'columntop-notcompleted-story-point'
                        totalStoryPointElement.textContent = displayNumber(columnTotalNotCompletedStoryPoint)
                        Object.keys(badgeStyle).forEach(key => {
                            totalStoryPointElement.style[key] = badgeStyle[key]
                        })

                        boardColumnHeader.appendChild(totalStoryPointElement)
                    }
                }
                // Completed StoryPoint (this is only displayed when there is at least one point)
                {
                    const hasTotalStoryPointElement = boardColumn.querySelector('.columntop-completed-story-point')
                    if(hasTotalStoryPointElement){
                        // Don't display if there are 0 items
                        if(columnTotalCompletedStoryPoint === 0){
                            hasTotalStoryPointElement.parentNode.removeChild(hasTotalStoryPointElement)
                            return
                        }

                        hasTotalStoryPointElement.textContent = displayNumber(columnTotalCompletedStoryPoint)
                    } else {
                        // Don't display if there are 0 items
                        if(columnTotalCompletedStoryPoint === 0){
                            return
                        }

                        // Create a total badge to display at the top
                        let totalStoryPointElement = document.createElement('span')
                        totalStoryPointElement.className = 'columntop-completed-story-point'
                        totalStoryPointElement.textContent = displayNumber(columnTotalCompletedStoryPoint)
                        Object.keys(badgeStyle).forEach(key => {
                            totalStoryPointElement.style[key] = badgeStyle[key]
                        })
                        totalStoryPointElement.style.background = completedBadgeColor

                        boardColumnHeader.appendChild(totalStoryPointElement)
                    }
                }
            })

            // Total within the board (displayed to the right of the project name at the top of the board)
            const boardTitleContainer = document.querySelector('.TopbarPageHeaderStructure-titleRow')
            if(!boardTitleContainer) return ;
            {
                const hasTotalStoryPointElement = document.querySelector('.boardtop-notcompleted-story-point')
                if(hasTotalStoryPointElement) {
                    hasTotalStoryPointElement.textContent = displayNumber(totalNotCompletedStoryPoint)
                } else {
                    // Don't display if there are 0 items
                    if(totalNotCompletedStoryPoint === 0) {
                        return
                    }
                    // Display total uncompleted SP badge
                    let totalStoryPointElement = document.createElement('span')
                    totalStoryPointElement.className = 'boardtop-notcompleted-story-point'
                    totalStoryPointElement.textContent = displayNumber(totalNotCompletedStoryPoint)
                    Object.keys(badgeStyle).forEach(key => {
                        totalStoryPointElement.style[key] = badgeStyle[key]
                    })
                    boardTitleContainer.appendChild(totalStoryPointElement)
                }
            }
            // Display total completed SP badge
            {
                const hasTotalStoryPointElement = document.querySelector('.boardtop-completed-story-point')
                if(hasTotalStoryPointElement) {
                    // Don't display if there are 0 items
                    if(totalCompletedStoryPoint === 0){
                        hasTotalStoryPointElement.parentNode.removeChild(hasTotalStoryPointElement)
                        return
                    }

                    hasTotalStoryPointElement.textContent = displayNumber(totalCompletedStoryPoint)
                } else {
                    // Don't display if there are 0 items
                    if(totalCompletedStoryPoint === 0) {
                        return
                    }
                    let totalStoryPointElement = document.createElement('span')
                    totalStoryPointElement.className = 'boardtop-completed-story-point'
                    totalStoryPointElement.textContent = displayNumber(totalCompletedStoryPoint)
                    Object.keys(badgeStyle).forEach(key => {
                        totalStoryPointElement.style[key] = badgeStyle[key]
                    })
                    totalStoryPointElement.style.background = completedBadgeColor
                    boardTitleContainer.appendChild(totalStoryPointElement)
                }
            }

        })

}, 1000)





setInterval(() => {
    // Elements to manipulate
    const calendarColumnsPromise = getElementsUntilRendered(document, '.ColumnBackedPotCalendarWeekViewSingleDayTasksList', 100)

    // Once all the elements have been fetched (when tasks are displayed)
    calendarColumnsPromise
		.catch(error => {})
        .then(calendarColumns => {
			if(!calendarColumns){return};
            calendarColumns.forEach(calendarColumn => {
            
				let totalNotCompletedStoryPoint = 0, totalCompletedStoryPoint = 0;
				
                // Elements to manipulate
                const calendarColumnHeader = calendarColumn.querySelector('.ColumnHeader')
                const taskNames = calendarColumn.querySelectorAll('.TaskCell-name')

                // Calculate SP
                let columnTotalNotCompletedStoryPoint = 0, columnTotalCompletedStoryPoint = 0;
                Array.prototype.forEach.call(taskNames, (e) => {
                    const taskCell = e.parentElement.parentElement.parentElement;
                    const isCompleted = taskCell.querySelector('.TaskRowCompletionStatus[aria-checked="true"]') !== null;
                    const sp_matched = e.textContent.match(/^\((\d+(?:\.\d+)?)\)/) // SP example: (10) tasks => 10
                    const sp_subtask_completed_matched = e.textContent.match(/\[(\d+(?:\.\d+)?)\]$/) // Partially completed task SP Example: (10) task [5] => 5/5
                    if(sp_matched){
                        if(isCompleted) {
                            columnTotalCompletedStoryPoint += Number(sp_matched[1])
                        } else {
                            if(sp_subtask_completed_matched) {
                                // Has subtask completion SP
                                columnTotalNotCompletedStoryPoint += Number(sp_matched[1]) - Number(sp_subtask_completed_matched[1])
                                columnTotalCompletedStoryPoint += Number(sp_subtask_completed_matched[1])
                            } else {
                                columnTotalNotCompletedStoryPoint += Number(sp_matched[1])
                            }
                        }
                    }
                })
                totalNotCompletedStoryPoint += columnTotalNotCompletedStoryPoint // TODO: Appears to be cumulative, not separate count for each day
                totalCompletedStoryPoint += columnTotalCompletedStoryPoint // TODO: Doesn't detect it properly


				if(totalNotCompletedStoryPoint + totalCompletedStoryPoint > 0){
					const report = `${totalNotCompletedStoryPoint+totalCompletedStoryPoint} total, ${totalCompletedStoryPoint} done, ${totalNotCompletedStoryPoint} remain`;
					const hasTotalStoryPointElement = calendarColumn.querySelector('.columntop-story-point');
					if(hasTotalStoryPointElement){
						hasTotalStoryPointElement.textContent = report;
					} else {
						let totalStoryPointElement = document.createElement('span');
						totalStoryPointElement.className = 'columntop-story-point';
						totalStoryPointElement.textContent = report;
						Object.keys(badgeStyle).forEach(key => {
							totalStoryPointElement.style[key] = badgeStyle[key];
						});

						calendarColumn.insertBefore(totalStoryPointElement, calendarColumn.firstChild);
					}
				}
            })
        })

}, 1000)






// List & Mytask
// セクション合計を右横に表示
setInterval(() => {
    // 操作するエレメント
    const listSectionsPromise = getElementsUntilRendered(document, '.DropTargetTaskGroupHeader', 100)

    // 操作するエレメントがすべて取得できたら (カード表示時)
    listSectionsPromise
		.catch(error => {})
        .then(listSections => {
            let totalNotCompletedStoryPoint = 0, totalCompletedStoryPoint = 0;

			if(!listSections){return;}

            // 各カラム別集計
            listSections.forEach(listSection => {

                // 操作するエレメント
                const listSectionHeader = listSection.querySelector('.TaskGroupHeader-headerContainer')
                const listSectionDropTargetRow = listSection.parentElement

                // SPの計算
                let columnTotalNotCompletedStoryPoint = 0, columnTotalCompletedStoryPoint = 0;

                // 手続き的ループ: 次の ListSectionに辿り着くまで１つずつ進む
                let cnt = 0

                // List
                let nextRow = listSectionDropTargetRow.querySelector('.DropTargetRow.ProjectSpreadsheetGridRow-dropTargetRow')
                // MyTask
                if (nextRow === null) {
                    nextRow = listSectionDropTargetRow.querySelector('.MyTasksSpreadsheetGridRow-dropTargetRow')
                }

                while( cnt < 1000 && nextRow && nextRow.querySelector('.SpreadsheetTaskName-input') ) {

                    const titleElement = nextRow.querySelector('.SpreadsheetTaskName-input')
                    const title = titleElement.textContent
                    const isCompleted = nextRow.getElementsByClassName('TaskRowCompletionStatus-taskCompletionIcon--complete').length !== 0;
                    const sp_matched = title.match(/^\((\d+(?:\.\d+)?)\)/) // SP   例: (10) タスク => 10
                    const sp_subtask_completed_matched = title.match(/\[(\d+(?:\.\d+)?)\]$/) // 部分完了タスクSP   例: (10) タスク [5]  => 5/5
                    if(sp_matched){
                        if(isCompleted) {
                            columnTotalCompletedStoryPoint += Number(sp_matched[1])
                        } else {
                            if(sp_subtask_completed_matched) {
                                // サブタスクの完了SPがある
                                columnTotalNotCompletedStoryPoint += Number(sp_matched[1]) - Number(sp_subtask_completed_matched[1])
                                columnTotalCompletedStoryPoint += Number(sp_subtask_completed_matched[1])
                            } else {
                                columnTotalNotCompletedStoryPoint += Number(sp_matched[1])
                            }
                        }
                    }
                    nextRow = nextRow.nextElementSibling
                    ++cnt
                }
                totalNotCompletedStoryPoint += columnTotalNotCompletedStoryPoint
                totalCompletedStoryPoint += columnTotalCompletedStoryPoint

                // 未終了StoryPoint
                {
                    const hasTotalStoryPointElement = listSection.querySelector('.columntop-notcompleted-story-point')
                    if(hasTotalStoryPointElement){
                        hasTotalStoryPointElement.textContent = displayNumber(columnTotalNotCompletedStoryPoint)
                    } else {
                        // 上部に表示する合計バッジを生成
                        let totalStoryPointElement = document.createElement('span')
                        totalStoryPointElement.className = 'columntop-notcompleted-story-point'
                        totalStoryPointElement.textContent = displayNumber(columnTotalNotCompletedStoryPoint)
                        Object.keys(badgeStyle).forEach(key => {
                            totalStoryPointElement.style[key] = badgeStyle[key]
                        })

                        // 右端に追加
                        listSectionHeader.appendChild(totalStoryPointElement)
                        // タイトルの左隣に追加
                        //const t = listSectionHeader.querySelector('.SectionRow-sectionName')
                        //listSectionHeader.insertBefore(totalStoryPointElement, t)
                    }
                }
                // 終了StoryPoint (こちらは1ポイント以上あるときのみ表示)
                {
                    const hasTotalStoryPointElement = listSection.querySelector('.columntop-completed-story-point')
                    if(hasTotalStoryPointElement){
                        // 0件なら表示しない
                        if(columnTotalCompletedStoryPoint === 0){
                            hasTotalStoryPointElement.parentNode.removeChild(hasTotalStoryPointElement)
                            return
                        }

                        hasTotalStoryPointElement.textContent = displayNumber(columnTotalCompletedStoryPoint)
                    } else {
                        // 0件なら表示しない
                        if(columnTotalCompletedStoryPoint === 0){
                            return
                        }

                        // 上部に表示する合計バッジを生成
                        let totalStoryPointElement = document.createElement('span')
                        totalStoryPointElement.className = 'columntop-completed-story-point'
                        totalStoryPointElement.textContent = displayNumber(columnTotalCompletedStoryPoint)
                        Object.keys(badgeStyle).forEach(key => {
                            totalStoryPointElement.style[key] = badgeStyle[key]
                        })
                        totalStoryPointElement.style.background = completedBadgeColor

                        listSectionHeader.appendChild(totalStoryPointElement)
                    }
                }
            })

            // ボード内合計 (ボード上部のプロジェクト名 右横に表示)
            const boardTitleContainer = document.querySelector('.TopbarPageHeaderStructure-titleRow')
            if(!boardTitleContainer) return ;
            {
                const hasTotalStoryPointElement = document.querySelector('.boardtop-notcompleted-story-point')
                if(hasTotalStoryPointElement) {
                    hasTotalStoryPointElement.textContent = displayNumber(totalNotCompletedStoryPoint)
                } else {
                    // 0件なら表示しない
                    if(totalNotCompletedStoryPoint === 0) {
                        return
                    }
                    // 合計未完了SPバッジを表示
                    let totalStoryPointElement = document.createElement('span')
                    totalStoryPointElement.className = 'boardtop-notcompleted-story-point'
                    totalStoryPointElement.textContent = displayNumber(totalNotCompletedStoryPoint)
                    Object.keys(badgeStyle).forEach(key => {
                        totalStoryPointElement.style[key] = badgeStyle[key]
                    })
                    boardTitleContainer.appendChild(totalStoryPointElement)
                }
            }
            // 合計完了SPバッジを表示
            {
                const hasTotalStoryPointElement = document.querySelector('.boardtop-completed-story-point')
                if(hasTotalStoryPointElement) {
                    // 0件なら表示しない
                    if(totalCompletedStoryPoint === 0){
                        hasTotalStoryPointElement.parentNode.removeChild(hasTotalStoryPointElement)
                        return
                    }

                    hasTotalStoryPointElement.textContent = displayNumber(totalCompletedStoryPoint)
                } else {
                    // 0件なら表示しない
                    if(totalCompletedStoryPoint === 0) {
                        return
                    }
                    let totalStoryPointElement = document.createElement('span')
                    totalStoryPointElement.className = 'boardtop-completed-story-point'
                    totalStoryPointElement.textContent = displayNumber(totalCompletedStoryPoint)
                    Object.keys(badgeStyle).forEach(key => {
                        totalStoryPointElement.style[key] = badgeStyle[key]
                    })
                    totalStoryPointElement.style.background = completedBadgeColor
                    boardTitleContainer.appendChild(totalStoryPointElement)
                }
            }

        })

}, 1000)

/**
 * 要素が取得できるまでループする関数 (max500ms)
 * @param {*} query
 * @param {*} wait ms
 */
function getElementUntilRendered(parent, query, wait) {
    return new Promise ((resolve, reject) => {
        function iter(counter) {
            if(counter*wait >= 500) {
                return reject()
            }
            const e = parent.querySelector(query)
            if(e) {
                return resolve(e)
            } else {
                return setTimeout(iter.bind(this, counter+1), wait)
            }
        }
        iter(0)
    })
}

/**
 * 要素が取得できるまでループする関数 (max500ms)
 * @param {*} query
 * @param {*} wait ms
 */
function getElementsUntilRendered(parent, query, wait) {
    return new Promise ((resolve, reject) => {
        function iter(counter) {
            if(counter*wait >= 500) {
                return reject()
            }
            const e = parent.querySelectorAll(query)
            if(e.length > 0) {
                return resolve(e)
            } else {
                return setTimeout(iter.bind(this, counter+1), wait)
            }
        }
        iter(0)
    })
}

function displayNumber(number) {
    return parseFloat(number.toFixed(2));
}
