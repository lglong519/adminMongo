$(document).ready(() => {
	// paginate if value is set
	if ($('#to_paginate').val() === 'true') {
		if (localStorage.getItem('message_text')) {
			show_notification(localStorage.getItem('message_text'), 'success');
			localStorage.setItem('message_text', '');
		}
		paginate().then(() => {
			// 点击链接按钮后，将按钮链接本地储存，如果当前页面地址与链接一致则显示文档详情
			// 可以在显示 table 的同时显示 JSON
			$('.link-doc').click(function () {
				localStorage.setItem('link', this.href);
			});
			if (location.href === localStorage.getItem('link')) {
				$('.list-cells>pre').parent().removeClass('d-none');
				$('.table-cells').removeClass('d-none');
			}
			$('#docLines td>pre').parent().on('mouseenter', function (e) {
				if (e.offsetX > $(this).width() / 2) {
					$(this).children('pre').addClass('p-right').removeClass('p-left');
				} else {
					$(this).children('pre').addClass('p-left').removeClass('p-right');
				}
			});
			$('#docLines td>pre').parent().mouseleave(function () {
				$(this).children('pre').removeClass('p-left p-right');
			});
			// 分页添加数据库标示
			$('#pager a').attr('href', (i, attr) => `${attr}?db=${sessionStorage.getItem('db')}`);
			// 修复分页按钮 >> 多次跳转
			$('#pager a').click(function () {
				if (this.parentNode.className.includes('disabled')) {
					return false;
				}
				window.location.href = this.href;
				return false;
			});
			// 禁止 list 模式下 json 文档的滚动事件，只允许 Body 滚动
			$('.code-mask').click(function () {
				$(this).hide();
			});
			$('.code-block').each(function () {
				this.addEventListener('wheel', () => {
					if (event.offsetX < $('.code-mask').width()) {
						if ($(this).children('.json').height() > $(this).height()) {
							$('.code-mask').show();
							event.preventDefault();
						} else {
							$('.code-mask').hide();
						}
					}
				});
			});
		});
	}

	// 添加数据库标示
	if (sessionStorage.getItem('db')) {
		$('.sub-menu>a,.breadcrumb>li:eq(3)>a').attr('href', (i, attr) => `${attr}?db=${sessionStorage.getItem('db')}`);
	}
	// checks localstorage for sidemenu being opened/closed state
	$('.mainMenu').each(function () {
		let menu = $(this).text().trim().toString();
		if (window.localStorage.getItem(menu) === 'opened') {
			$(this).removeClass('collapsed');
			$(this).nextUntil('.mainMenu').slideDown('fast');
		}
	});

	// inital stage of docs per page
	if (localStorage.getItem('docsPerPage')) {
		$('#docsPerPage').val(localStorage.getItem('docsPerPage'));
	}

	// toggle the sidebar, resize the main view
	$(document).on('click', '#sidebarToggle', () => {
		$('.row-offcanvas').toggleClass('active');
		$('#sidebar').toggleClass('hidden-xs');
		$('#sidebar').toggleClass('hidden-sm');
		$('#sidebar').toggleClass('hidden-md');
		$('#sidebar').toggleClass('hidden-lg');
		if ($('.row-offcanvas').hasClass('active')) {
			$('#main').removeClass('col-sm-9 col-lg-10');
			$('#main').addClass('col-sm-12 col-lg-12');
		} else {
			$('#main').removeClass('col-sm-12 col-lg-12');
			$('#main').addClass('col-sm-9 col-lg-10');
		}
	});

	// allow collapsable side menu's
	$(document).on('click', '.mainMenuToggle', function () {
		if ($(this).parent().hasClass('collapsed')) {
			window.localStorage.setItem($(this).prev().text().trim(), 'opened');
			$(this).parent().removeClass('collapsed');
			$(this).parent().nextUntil('.mainMenu').slideDown('fast');
		} else {
			window.localStorage.setItem($(this).prev().text().trim(), 'closed');
			$(this).parent().addClass('collapsed');
			$(this).parent().nextUntil('.mainMenu').slideUp('fast');
		}
	});

	// To reset we call paginate() with no query object
	$(document).on('click', '#searchReset', () => {
		if (!$('#searchReset').hasClass('disabled')) {
			localStorage.removeItem('searchQuery');
			window.location.href = `${$('#app_context').val()}/app/${$('#conn_name').val()}/${$('#db_name').val()}/${$('#coll_name').val()}/view/1`;
		}
	});

	$(document).on('click', '#queryDocumentsAction', () => {
		let editor = ace.edit('json');
		let editor_val = editor.getValue();

		if (editor_val !== '') {
			// set the query in localStorage
			localStorage.setItem('searchQuery', editor_val);

			// go to page 1 to remove any issues being on page X from another query/view
			window.location.href = `${$('#app_context').val()}/app/${$('#conn_name').val()}/${$('#db_name').val()}/${$('#coll_name').val()}/view/1`;

			// close the queryDocuments
			$('#queryDocuments').modal('hide');
		} else {
			show_notification('Please enter a query', 'danger');
		}
	});

	// redirect to export
	$(document).on('click', '#exportModalAction', () => {
		let exportId = $('#exportExcludeID').is(':checked') ? 'true' : 'false';
		window.location.href = `${$('#app_context').val()}/collection/${$('#conn_name').val()}/${$('#db_name').val()}/${$('#export_coll').val()}/export/${exportId}`;
	});

	// sets the collection name to be used later to export entire collection
	$(document).on('click', '.exportLink', function () {
		$('#exportExcludeID').prop('checked', false);
		$('#export_coll').val($(this).attr('id'));
	});

	// when docs per page is changed
	$(document).on('change', '#docsPerPage', () => {
		localStorage.setItem('docsPerPage', $('#docsPerPage').val());
		window.location = `${$('#app_context').val()}/app/${$('#conn_name').val()}/${$('#db_name').val()}/${$('#coll_name').val()}/view/1`;
	});

	// 输入搜索内容自动切换数据类型
	let onclick = false;
	$('#searchForm input:radio').click(() => {
		onclick = true;
	});
	$('#search_value_value').on('input blur focus', function () {
		let key_name = $('#search_key_fields option:selected').text();
		if (key_name === '_id') {
			$('#input-Oid').prop('checked', true);
			return;
		}
		if (!onclick) {
			if ((/^[\d.]+$/).test(this.value)) {
				$('#input-Num').prop('checked', true);
			} else if ((/^(true|false)$/).test(this.value)) {
				$('#input-Bool').prop('checked', true);
			} else {
				$('#input-Str').prop('checked', true);
			}
		}
	});

	// set the URL search parameters
	$(document).on('click', '#searchModalAction', () => {
		let key_name = $('#search_key_fields option:selected').text();
		let val = $('#search_value_value').val();

		if ($('#sortToggle').prop('checked')) {
			let sort_key = $('#sort_key_fields option:selected').text();
			let sort = { [sort_key]: 1 };
			if ($('#sortDesc').prop('checked')) {
				sort[sort_key] = -1;
			}
			localStorage.setItem('sort', JSON.stringify(sort));
		}

		if (key_name !== '' && val !== '') {
			// build the simply key/value query object and call paginate();
			let qry_obj = {};
			let query_string;
			let type = $('#searchForm input[name=inputType]:checked').val();
			let filterType = $('#searchForm input[name=filterType]:checked').val();

			// 根据选择的类型查询文档，支持的类型有 Oid(ObjectId),Str,Num,Bool,Date,ISO(ISODate)
			switch (type) {
				case 'Oid': val = { $oid: val }; break;
				case 'Date': val = { $date: new Date(val).toISOString() }; break;
				case 'ISO': val = { $date: val }; break;
				case 'Num': val = parseInt(val); break;
				case 'Bool': val = val === 'true'; break;
				case 'Obj':
					try {
						val = JSON.parse(val);
					} catch (e) {
						eval(`val=${val}`);
					}
					break;
				default: val = String(val);
			}
			if (filterType) {
				qry_obj[key_name] = { [filterType]: val };
			} else {
				qry_obj[key_name] = val;
			}

			if (!query_string) {
				query_string = JSON.stringify(qry_obj);
			}
			// set the object to local storage to be used if page changes
			localStorage.setItem('searchQuery', query_string);
			// go to page 1 to remove any issues being on page X from another query/view
			window.location.href = `${$('#app_context').val()}/app/${$('#conn_name').val()}/${$('#db_name').val()}/${$('#coll_name').val()}/view/1`;

			// close the searchModal
			$('#searchModal').modal('hide');
		} else {
			if ($('#sortToggle').prop('checked')) {
				window.location.href = `${$('#app_context').val()}/app/${$('#conn_name').val()}/${$('#db_name').val()}/${$('#coll_name').val()}/view/1`;
			} else {
				show_notification('Please enter a key (field) and a value to search for', 'danger');
			}
		}
	});

	// 清除排序
	$('#searchQuery button').click(() => {
		localStorage.removeItem('sort');
		window.location.href = `${$('#app_context').val()}/app/${$('#conn_name').val()}/${$('#db_name').val()}/${$('#coll_name').val()}/view/1`;
	});

	$(document).on('click', '#coll_name_edit', () => {
		let newCollName = $('#coll_name_newval').val();
		if (newCollName !== '') {
			$.ajax({
				method: 'POST',
				url: `${$('#app_context').val()}/collection/${$('#conn_name').val()}/${$('#db_name').val()}/${$('#coll_name').val()}/coll_name_edit`,
				data: { 'new_collection_name': newCollName }
			})
				.done(data => {
					$('#headCollectionName').text(newCollName);
					$('#collectioName').modal('toggle');
					localStorage.setItem('message_text', data.msg);
					window.location.href = `${$('#app_context').val()}/app/${$('#conn_name').val()}/${$('#db_name').val()}/${newCollName}/view?page=1`;
				})
				.fail(data => {
					show_notification(data.responseJSON.msg, 'danger');
				});
		} else {
			show_notification('Please enter an index', 'danger');
		}
	});

	$(document).on('click', '#coll_create', () => {
		if ($('#new_coll_name').val() !== '') {
			$.ajax({
				method: 'POST',
				url: `${$('#app_context').val()}/collection/${$('#conn_name').val()}/${$('#db_name').val()}/coll_create`,
				data: { 'collection_name': $('#new_coll_name').val() }
			})
				.done(data => {
					$('#del_coll_name').append(`<option>${$('#new_coll_name').val()}</option>`);
					$('#new_coll_name').val('');
					show_notification(data.msg, 'success');
				})
				.fail(data => {
					show_notification(data.responseJSON.msg, 'danger');
				});
		} else {
			show_notification('Please enter a collection name', 'danger');
		}
	});

	$(document).on('click', '#coll_delete', () => {
		if (confirm('WARNING: Are you sure you want to delete this collection and all documents?') === true) {
			$.ajax({
				method: 'POST',
				url: `${$('#app_context').val()}/collection/${$('#conn_name').val()}/${$('#db_name').val()}/coll_delete`,
				data: { 'collection_name': $('#del_coll_name option:selected').text() }
			})
				.done(data => {
					$(`#del_coll_name option:contains('${data.coll_name}')`).remove();
					$('#del_coll_name').val($('#del_coll_name option:first').val());
					show_notification(data.msg, 'success');
				})
				.fail(data => {
					show_notification(data.responseJSON.msg, 'danger');
				});
		}
	});

	$(document).on('click', '#db_create', () => {
		if ($('#new_db_name').val() !== '') {
			$.ajax({
				method: 'POST',
				url: `${$('#app_context').val()}/database/${$('#conn_name').val()}/db_create`,
				data: { 'db_name': $('#new_db_name').val() }
			})
				.done(data => {
					$('#del_db_name').append(`<option>${$('#new_db_name').val()}</option>`);
					$('#new_db_name').val('');
					show_notification(data.msg, 'success');
				})
				.fail(data => {
					show_notification(data.responseJSON.msg, 'danger');
				});
		} else {
			show_notification('Please enter a database name', 'danger');
		}
	});

	$(document).on('click', '#db_delete', () => {
		if (confirm('WARNING: Are you sure you want to delete this database and all collections?') === true) {
			$.ajax({
				method: 'POST',
				url: `${$('#app_context').val()}/database/${$('#conn_name').val()}/db_delete`,
				data: { 'db_name': $('#del_db_name option:selected').text() }
			})
				.done(data => {
					$(`#del_db_name option:contains('${data.db_name}')`).remove();
					$('#del_db_name').val($('#del_db_name option:first').val());
					show_notification(data.msg, 'success', true);
				})
				.fail(data => {
					show_notification(data.responseJSON.msg, 'danger');
				});
		}
	});

	$(document).on('click', '#user_create', () => {
		if ($('#new_username').val() === '') {
			show_notification('Please enter a Username', 'danger');
			return;
		}
		if ($('#new_password').val() === '' || $('#new_password_confirm').val() === '') {
			show_notification('Please enter a password and confirm', 'danger');
			return;
		}
		if ($('#new_password').val() !== $('#new_password_confirm').val()) {
			show_notification('Passwords do not match', 'danger');
			return;
		}

		$.ajax({
			method: 'POST',
			url: `${$('#app_context').val()}/users/${$('#conn_name').val()}/${$('#db_name').val()}/user_create`,
			data: {
				'username': $('#new_username').val(),
				'user_password': $('#new_password').val(),
				'roles_text': $('#new_user_roles').val()
			}
		})
			.done(data => {
				$('#del_user_name').append(`<option>${$('#new_username').val()}</option>`);
				show_notification(data.msg, 'success');

				// clear items
				$('#new_username').val('');
				$('#new_password').val('');
				$('#new_password_confirm').val('');
				$('#new_user_roles').val('');
			})
			.fail(data => {
				show_notification(data.responseJSON.msg, 'danger');
			});
	});

	$(document).on('click', '#btnqueryDocuments', () => {
		let editor = ace.edit('json');
		if (localStorage.getItem('searchQuery')) {
			editor.setValue(localStorage.getItem('searchQuery'));
		} else {
			editor.setValue('{}');
		}
	});

	$(document).on('click', '#user_delete', () => {
		if (confirm('WARNING: Are you sure you want to delete this user?') === true) {
			$.ajax({
				method: 'POST',
				url: `${$('#app_context').val()}/users/${$('#conn_name').val()}/${$('#db_name').val()}/user_delete`,
				data: { 'username': $('#del_user_name option:selected').text() }
			})
				.done(data => {
					$(`#del_user_name option:contains('${$('#del_user_name option:selected').text()}')`).remove();
					$('#del_user_name').val($('#del_user_name option:first').val());
					show_notification(data.msg, 'success');
				})
				.fail(data => {
					show_notification(data.responseJSON.msg, 'danger');
				});
		}
	});

	$(document).on('click', '#add_config', () => {
		if ($('#new_conf_conn_name').val() !== '' && $('#new_conf_conn_string').val() !== '') {
			let editor = ace.edit('json');
			let editor_val = editor.getValue();

			if (editor_val === '') {
				editor_val = {};
			}

			let data_obj = {};
			data_obj[0] = $('#new_conf_conn_name').val();
			data_obj[1] = $('#new_conf_conn_string').val();
			data_obj[2] = editor_val;

			$.ajax({
				method: 'POST',
				url: `${$('#app_context').val()}/config/add_config`,
				data: data_obj
			})
				.done(data => {
					show_notification(data.msg, 'success');
					setInterval(() => {
						location.reload();
					}, 2500);
				})
				.fail(data => {
					show_notification(data.responseJSON.msg, 'danger');
				});
		} else {
			show_notification('Please enter both a connection name and connection string', 'danger');
		}
	});

	$(document).on('click', '.btnConnDelete', function () {
		if (confirm('WARNING: Are you sure you want to delete this connection?') === true) {
			let current_name = $(this).parents('.conn_id').attr('id');
			let rowElement = $(this).parents('.connectionRow');

			$.ajax({
				method: 'POST',
				url: `${$('#app_context').val()}/config/drop_config`,
				data: { 'curr_config': current_name }
			})
				.done(data => {
					rowElement.remove();
					show_notification(data.msg, 'success');
				})
				.fail(data => {
					show_notification(data.responseJSON.msg, 'danger');
				});
		}
	});

	$(document).on('click', '.btnConnUpdate', function () {
		if ($('#conf_conn_name').val() !== '' || $('#conf_conn_string').val() !== '') {
			let current_name = $(this).parents('.conn_id').attr('id');
			let new_name = $(this).parents('.connectionRow').find('.conf_conn_name').val();
			let new_string = $(this).parents('.connectionRow').find('.conf_conn_string').val();

			$.ajax({
				method: 'POST',
				url: `${$('#app_context').val()}/config/update_config`,
				data: { 'curr_config': current_name, 'conn_name': new_name, 'conn_string': new_string }
			})
				.done(function (data) {
					$(this).parents('.connectionRow').find('.conf_conn_name').val(data.name);
					$(this).parents('.connectionRow').find('.conf_conn_string').val(data.string);
					show_notification(data.msg, 'success', true);
				})
				.fail(data => {
					show_notification(data.responseJSON.msg, 'danger');
				});
		} else {
			show_notification('Please enter a connection name and connection string', 'danger');
		}
	});

	// redirect to connection
	$(document).on('click', '.btnConnConnect', function () {
		window.location.href = `${$('#app_context').val()}/app/${$(this).parents('.conn_id').attr('id')}`;
	});
	// JSON 或者 表格方式显示数据
	let viewTypes = ['list', 'table'];
	if ($('#viewType')) {
		if (localStorage.getItem('view')) {
			$(`#viewType .coll-${localStorage.getItem('view')}`).addClass('label-success');
		} else {
			$('#viewType .coll-list').addClass('label-success');
			localStorage.setItem('view', 'list');
		}
	}
	/*
		coll-list JSON的形式
		coll-table 表格的形式
	*/
	viewTypes.forEach(type => {
		$(`#viewType .coll-${type}`).click(function () {
			if ($(this).hasClass('label-success')) {
				return;
			}
			$(this).addClass('label-success');
			$(`#viewType .coll-${'listtable'.replace(type, '')}`).removeClass('label-success');

			$(`.${type}-cells`).removeClass('d-none');
			$(`.${'listtable'.replace(type, '')}-cells`).addClass('d-none');

			localStorage.setItem('view', type);
		});
	});
	/*
		跳转到选中的 collection
	*/
	let coll_name = $('#coll_name').val();
	let db_name = $('#db_name').val();
	if (db_name && coll_name) {
		let currentColl = `${db_name}_${coll_name}`;
		$('#sidebar').animate(
			{ scrollTop: $(`#${currentColl}`).offset().top - $(window).height() / 2 },
			{ duration: 500, easing: 'swing' }
		);
		$(`#${currentColl}`).addClass('active');
	}

	if (localStorage.getItem('searchQuery')) {
		$('#searchQuery span:first-child').html(localStorage.getItem('searchQuery'));
	}
	if (localStorage.getItem('sort')) {
		$('#searchQuery button').removeClass('hidden');
		$('#searchQuery span:nth-child(3)').html(localStorage.getItem('sort'));
	} else {
		$('#searchQuery button').hide();
	}
	// 设置数据库标示
	$('.breadcrumb>li:eq(2)>a').click(() => {
		sessionStorage.setItem('db', db_name);
	});
	// 清除数据库标示
	$('.breadcrumb>li:lt(2)>a,#navbar li:eq(1) a,#sidebar .list-group>li:eq(1) a,#sidebar .list-group:eq(1)>li:lt(2) a').click(() => {
		sessionStorage.removeItem('db');
	});
	$('#sortToggle').change(function () {
		if (this.checked) {
			$('#sort_key_fields').show();
		} else {
			$('#sortDesc').prop('checked', false);
			$('#sort_key_fields').hide();
		}
	});
	$('#sortDesc').change(function () {
		if (this.checked) {
			$('#sortToggle').prop('checked', true);
			$('#sort_key_fields').show();
		}
	});
});

function paginate () {
	$('#doc_load_placeholder').show();

	let page_num = $('#page_num').val();
	let page_len = $('#docs_per_page').val();
	let coll_name = $('#coll_name').val();
	let conn_name = $('#conn_name').val();
	let db_name = $('#db_name').val();
	let doc_id = $('#doc_id').val();

	// check local storage for pagination
	if (localStorage.getItem('docsPerPage')) {
		page_len = localStorage.getItem('docsPerPage');
	} else {
		localStorage.setItem('docsPerPage', page_len);
	}

	// get the query (if any)
	let query_string;
	if (doc_id) {
		if ((/^\d*$/).test(doc_id)) {
			query_string = `{"_id":${doc_id}}`;
		} else {
			query_string = toEJSON.serializeString(`{"_id":ObjectId("${doc_id}")}`);
		}
	} else {
		query_string = localStorage.getItem('searchQuery');
		query_string = toEJSON.serializeString(query_string);
	}
	let sort = localStorage.getItem('sort') || '{"_id":1}';
	// add search to the API URL if it exists
	let api_url = `${$('#app_context').val()}/api/${conn_name}/${db_name}/${coll_name}/${page_num}`;
	let pager_href = `${$('#app_context').val()}/app/${conn_name}/${db_name}/${coll_name}/view/{{number}}`;

	return $.ajax({
		type: 'POST',
		dataType: 'json',
		url: api_url,
		data: { 'query': query_string, 'docsPerPage': page_len, sort }
	})
		.done(response => {
			// show message when none are found
			if (response.data === '' || response.total_docs === 0) {
				$('#doc_none_found').removeClass('hidden');
			} else {
				$('#doc_none_found').addClass('hidden');
			}

			let total_docs = Math.ceil(response.total_docs / page_len);

			// remove the doc class when single doc is retured
			let docClass = 'doc_view';
			if (response.total_docs === 1) {
				docClass = '';
			}

			if (total_docs > 1) {
				$('#pager').show();
				$('#pager').bootpag({
					total: total_docs,
					page: page_num,
					maxVisible: 5,
					href: pager_href,
					firstLastUse: true
				});
			} else {
				$('#pager').hide();
			}

			let isFiltered = '';

			// enable/disable the reset filter button
			if (query_string == null) {
				$('#searchReset').addClass('disabled');
			} else {
				$('#searchReset').removeClass('disabled');
				isFiltered = ' <span class=\'text-danger\'>(filtered)</span>';
			}

			// set the total record count
			$('#recordCount').html(response.total_docs + isFiltered);

			// if filtered, change button text
			if (query_string !== null) {
				// $('#btnMassDelete').html('Delete selected');
			}

			// disable/enable the mass delete button if records are returned
			if (total_docs === 0) {
				$('#btnMassDelete').prop('disabled', true);
			} else {
				$('#btnMassDelete').prop('disabled', false);
			}

			// clear the div first
			$('#coll_docs').empty();

			let viewType = localStorage.getItem('view');
			let table = `
				<div class="col-xs-12 col-md-12 col-lg-12 no-wrap ${viewType == 'list' ? 'd-none' : ''} table-cells">
					<div class="d-inline-block">
						<table class="table table-bordered bg-grey">
							<thead>
								<tr id="docKeys"></tr>
							</thead>
							<tbody id="docLines"></tbody>
						</table>
					</div>
					<div class="d-inline-block">
						<table class="table table-bordered">
							<thead id="operatTh"></thead>
							<tbody id="operatorLines"></tbody>
						</table>
					</div>
				</div>
				`;
			$('#coll_docs').append(table);

			let escaper = $('<div></div>');
			let keys = [];
			for (let i = 0; i < response.data.length; i++) {
				escaper[0].textContent = JSON.stringify(response.data[i], null, 4);
				let inner_html = `<div class="col-xs-12 col-md-10 col-lg-10 no-side-pad ${viewType == 'table' ? 'd-none' : ''} list-cells"><div class="scroll-view"></div><div class="code-mask"></div><pre class="code-block ${docClass}"><i class="fa fa-chevron-down code-block_expand"></i><code class="json">${escaper[0].innerHTML}</code></pre></div>`;
				inner_html += `<div class="col-md-2 col-lg-2 pad-bottom no-pad-right justifiedButtons ${viewType == 'table' ? 'd-none' : ''} list-cells">`;
				inner_html += '<div class="btn-group btn-group-justified justifiedButtons" role="group" aria-label="...">';
				inner_html += `<a href="#" class="btn btn-danger btn-sm" onclick="deleteDoc('${response.data[i]._id}')">${response.deleteButton}</a>`;
				inner_html += `<a href="${$('#app_context').val()}/app/${conn_name}/${db_name}/${coll_name}/${response.data[i]._id}" class="btn btn-info btn-sm link-doc">${response.linkButton}</a>`;
				inner_html += `<a href="${$('#app_context').val()}/app/${conn_name}/${db_name}/${coll_name}/edit/${response.data[i]._id}" class="btn btn-success btn-sm">${response.editButton}</a>`;
				inner_html += '</div></div>';
				$('#coll_docs').append(inner_html);

				if (!keys.length) {
					keys = Object.keys(response.data[i]);
				}
				let cells = cellGenerator(keys.length);
				for (let key in response.data[i]) {
					let index = keys.indexOf(key);
					if (index < 0) {
						keys.push(key);
						cellsUpdate(cells);
						index = keys.length - 1;
					}
					let prop = response.data[i][key];
					let type = Object.prototype.toString.call(prop);
					if (type === '[object Object]') {
						cellsUpdate(cells, index, '{Object}', prop);
						continue;
					}
					if (type === '[object Array]') {
						cellsUpdate(cells, index, '[Array]', prop);
						continue;
					}
					if ((/^\d{4}-\d{2}-\d{2}T(.*)?Z$/).test(prop)) {
						cellsUpdate(cells, index, formatTime(prop));
					}
					cellsUpdate(cells, index, prop);
				}
				$('#docLines').append(`<tr>${cells.join('')}</tr>`);

				let operatorCells = cellGenerator(3);
				cellsUpdate(operatorCells, 0, `<a href="#" onclick="deleteDoc('${response.data[i]._id}')">${response.deleteButton}</a>`);
				cellsUpdate(operatorCells, 1, `<a class="link-doc" href="${$('#app_context').val()}/app/${conn_name}/${db_name}/${coll_name}/${response.data[i]._id}">${response.linkButton}</a>`);
				cellsUpdate(operatorCells, 2, `<a href="${$('#app_context').val()}/app/${conn_name}/${db_name}/${coll_name}/edit/${response.data[i]._id}">${response.editButton}</a>`);
				$('#operatorLines').append(`<tr>${operatorCells.join('')}</tr>`);

			}
			if (keys.length) {
				$('#operatTh').append(`
				<tr class="text-white">
					<th class="bg-danger">删除</th>
					<th class="bg-info">查看</th>
					<th class="bg-success">编辑</th>
				</tr>
			`);
				$('#docKeys').append(thGenerator(keys));
			}

			// Bind the DropDown Select For Fields
			let option = '';
			for (let x = 0; x < response.fields.length; x++) {
				option += `<option value="${response.fields[x]}">${response.fields[x]}</option>`;
			}
			$('#search_key_fields').append(option);
			$('#sort_key_fields').append(option);

			// hide the loading placeholder
			$('#doc_load_placeholder').hide();

			// hook up the syntax highlight and prettify the json
			hljs.configure({ languages: ['json'] });
			$('.code-block').each((i, block) => {
				hljs.highlightBlock(block);
				$(block).find('.code-block_expand').click(() => {
					$(block).toggleClass('expanded');
				});
			});

			// Show extended message if API returns an invalid query
			if (response.validQuery === false) {
				show_notification(`Invalid query syntax${response.queryMessage}`, 'danger', false, 3000);
			}
		})
		.fail(() => {
			show_notification('Error getting data from Query API', 'danger');
		});
}

function deleteDoc (doc_id) {
	if (confirm('WARNING: Are you sure you want to delete this document?') === true) {
		$.ajax({
			method: 'POST',
			url: `${$('#app_context').val()}/document/${$('#conn_name').val()}/${$('#db_name').val()}/${$('#coll_name').val()}/doc_delete`,
			data: { doc_id }
		})
			.done(data => {
				show_notification(data.msg, 'success');
				paginate();
			})
			.fail(data => {
				show_notification(data.responseJSON.msg, 'danger');
			});
	}
}

$(document).on('click', '#btnMassDelete', () => {
	let doc_id = $('#doc_id').val();
	let coll_name = $('#coll_name').val();
	let conn_name = $('#conn_name').val();
	let db_name = $('#db_name').val();
	let query_string;

	// get the query (if any)
	if (doc_id) {
		query_string = toEJSON.serializeString(`{"_id":ObjectId("${doc_id}")}`);
	} else {
		let local_query_string = localStorage.getItem('searchQuery');
		query_string = toEJSON.serializeString(local_query_string);
	}

	// set the default confirm text
	let confirmText = 'WARNING: Are you sure you want to delete all documents in this collection?';

	// if a query is specified, show the "selection" alternative text
	if (query_string) {
		confirmText = 'WARNING: Are you sure you want to delete the selection of documents?';
	}

	if (confirm(confirmText) === true) {
		$.ajax({
			method: 'POST',
			url: `${$('#app_context').val()}/document/${conn_name}/${db_name}/${coll_name}/mass_delete`,
			data: { 'query': query_string }
		})
			.done(data => {
				localStorage.removeItem('searchQuery');
				show_notification(data.msg, 'success', true);
			})
			.fail(data => {
				show_notification(data.responseJSON.msg, 'danger');
			});
	}
});

// restore DB
$(document).on('click', '#db_restore', () => {
	if ($('#restore_db_name').val() !== null) {
		if (confirm(`WARNING: Are you absolutely sure you want to restore the "${$('#restore_db_name').val()}" database?`) === true) {
			$.ajax({
				method: 'POST',
				url: `${$('#app_context').val()}/database/${$('#conn_name').val()}/${$('#restore_db_name').val()}/db_restore/`,
				data: { 'dropTarget': $('#restore_db_action').val() }
			})
				.done(data => {
					show_notification(data.msg, 'success', true);
				})
				.fail(data => {
					show_notification(data.responseJSON.msg, 'danger');
				});
		}
	}
});

// backup DB
$(document).on('click', '#db_backup', () => {
	$.ajax({
		method: 'POST',
		url: `${$('#app_context').val()}/database/${$('#conn_name').val()}/${$('#backup_db_name').val()}/db_backup/`,
		data: {}
	})
		.done(data => {
			show_notification(data.msg, 'success', true);
		})
		.fail(data => {
			show_notification(data.responseJSON.msg, 'danger');
		});
});

$(document).on('click', '#coll_addindex', () => {
	let edit = ace.edit('json');
	let json = $.parseJSON(edit.getValue());

	if (json !== '{}') {
		let data_obj = {};
		data_obj[0] = JSON.stringify(json);
		data_obj[1] = $('#index_unique').is(':checked') ? 'true' : 'false';
		data_obj[2] = $('#index_sparse').is(':checked') ? 'true' : 'false';

		$.ajax({
			method: 'POST',
			url: `${$('#app_context').val()}/collection/${$('#conn_name').val()}/${$('#db_name').val()}/${$('#coll_name').val()}/create_index`,
			data: data_obj
		})
			.done(data => {
				show_notification(data.msg, 'success', true);
			})
			.fail(data => {
				show_notification(data.responseJSON.msg, 'danger');
			});
	} else {
		show_notification('Please enter an index', 'danger');
	}
});

function dropIndex (index_index) {
	$.ajax({
		method: 'POST',
		url: `${$('#app_context').val()}/collection/${$('#conn_name').val()}/${$('#db_name').val()}/${$('#coll_name').val()}/drop_index`,
		data: { 'index': index_index }
	})
		.done(data => {
			$(`#index_row_${index_index}`).remove();
			show_notification(data.msg, 'success');
		})
		.fail(data => {
			show_notification(data.responseJSON.msg, 'danger');
		});
}

// show notification popup
function show_notification (msg, type, reload_page, timeout) {
	// defaults to false
	reload_page = reload_page || false;
	timeout = timeout || 3000;

	$('#notify_message').removeClass();
	$('#notify_message').addClass(`notify_message-${type}`);
	$('#notify_message').html(msg);
	$('#notify_message').slideDown(600).delay(timeout).slideUp(600, () => {
		if (reload_page === true) {
			location.reload();
		}
	});
}

function formatTime (date) {
	if (!(date instanceof Date)) {
		date = new Date(date);
	}
	const year = date.getFullYear();
	const month = date.getMonth() + 1;
	const day = date.getDate();
	const hour = date.getHours();
	const minute = date.getMinutes();
	const second = date.getSeconds();

	return `${[year, month, day].map(formatNumber).join('-')} ${[hour, minute, second].map(formatNumber).join(':')}`;
}

function formatNumber (n) {
	n = n.toString();
	return n[1] ? n : `0${n}`;
}

function cellGenerator (length) {
	let tds = [];
	for (let i = 0; i < length; i++) {
		tds.push('<td>null</td>');
	}
	return tds;
}
function cellsUpdate (cells, index, val, subContent = '') {
	if (subContent) {
		val += `<pre class="d-none">${JSON.stringify(subContent, null, 4)}</pre>`;
	}
	if (index !== undefined) {
		cells[index] = cells[index].replace('null', val);
	} else {
		cells.push('<td>null</td>');
	}
}
function thGenerator (keys) {
	let ths = [];
	for (let i = 0; i < keys.length; i++) {
		if (keys[i].endsWith('At')) {
			ths.push(`<th class="td-min-width">${keys[i]}</th>`);
			continue;
		}
		ths.push(`<th>${keys[i]}</th>`);
	}
	return ths.join('');
}
